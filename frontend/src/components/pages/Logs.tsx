// File: src/pages/Logs.tsx
import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import 'ojs/ojtable';
import 'ojs/ojbutton';
import ArrayDataProvider = require('ojs/ojarraydataprovider');
import { useToast } from '../../context/ToastContext'
import 'oj-c/message-toast'

import 'oj-c/table';

interface LogEntry {
  _id: string;
  app_id: string;
  message: string;
  timestamp: string;
  log_type: string;
  ingested_at: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// Helper to decode JWT
const parseJwt = (token: string | null): any => {
  if (!token) return null;
  try {
    const base64Payload = token.split('.')[1];
    const jsonPayload = atob(base64Payload);
    return JSON.parse(jsonPayload);
  } catch (err) {
    console.error('Error decoding token', err);
    return null;
  }
};

const Logs = (props: { path?: string }) => {
  const [adminLogs, setAdminLogs] = useState<LogEntry[]>([]);
  const [dataProvider, setDataProvider] = useState<any>(null);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const { addNewToast, messageDataProvider, removeToast } = useToast()
  const closeMessage = (event: CustomEvent<{ key: string }>) => {
    removeToast(event.detail.key)
    // const closeKey = event.detail.key
    // setMessages(messages.filter((msg) => msg.id !== closeKey))
  }
  useEffect(() => {
    fetchLogs(pagination.page);
  }, []);

  const fetchLogs = async (page: number) => {
    try {
      const token = localStorage.getItem('jwt');
      const user = parseJwt(token);
      const isAdmin = user?.isAdmin;
      const userId = user?._id;

      const endpoint = isAdmin
        ? `http://localhost:3001/api/logs?page=${page}&limit=${pagination.limit}`
        : `http://localhost:3001/api/logs/${userId}?page=${page}&limit=${pagination.limit}`;

      const res = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();
      const formattedLogs = (data.logs || []).map((log: LogEntry) => ({
        ...log,
        timestamp: new Date(log.timestamp).toLocaleString(),
        ingested_at: new Date(log.ingested_at).toLocaleString(), // Optional
      }));
      setAdminLogs(formattedLogs || []);
      setPagination(data.pagination || {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      });

      setDataProvider(new ArrayDataProvider(formattedLogs || [], { keyAttributes: '_id' }));

      if (!res.ok) {
        addNewToast('error', 'Error', data.message || 'Failed to fetch logs.');
      } 
    } catch (error) {
      addNewToast('error', 'Error', 'Failed to fetch logs.');
      console.error("Failed to fetch logs", error);
    }
  };

  const goToNextPage = () => {
    if (pagination.hasNextPage) {
      fetchLogs(pagination.page + 1);
    }
  };

  const goToPrevPage = () => {
    if (pagination.hasPrevPage) {
      fetchLogs(pagination.page - 1);
    }
  };

  return (
    <div
      class="oj-flex oj-sm-justify-content-center oj-sm-flex-direction-column"
      style="height: 100%; min-height: 0; flex: 1 1 0;"
    >
      <div class="oj-flex oj-sm-12 oj-sm-padding-2x oj-sm-justify-content-space-between oj-sm-align-items-center">
        <h1 class="oj-typography-heading-md">Logs</h1>
      </div>
        

      <div
        class="oj-flex oj-sm-margin-x-4x oj-sm-margin-bottom-4x"
        style={{
          flex: 1,
          minHeight: 0,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '16px',
          overflow: 'hidden',
        }}
      >
        <oj-c-table
          data={dataProvider}
          columns={{
            "App Name": { field: 'app_name', headerText: 'App Name' },
            "Log Type": { field: 'log_type', headerText: 'Log Type' },
            "Message": { field: 'message', headerText: 'Message', tooltip: 'enabled' },
            "Timestamp": { field: 'timestamp', headerText: 'Timestamp' },
          }}
          class="oj-sm-12"
          horizontal-grid-visible="enabled"
          vertical-grid-visible="enabled"
          style="width: 100%; flex: 1 1 0; min-width: 0; min-height: 0; table-layout: fixed;" // changed from auto to fixed
        ></oj-c-table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div
          class="oj-flex oj-sm-flex-direction-row oj-sm-align-items-center oj-sm-justify-content-center oj-sm-margin-y-4x"
          style="gap: 16px;"
        >
          <oj-button
            chroming="callToAction"
            onojAction={goToPrevPage}
            disabled={!pagination.hasPrevPage}
          >
            <span slot="startIcon" class="oj-ux-ico-arrow-left"></span>
            Previous
          </oj-button>

          <span class="oj-typography-body-md oj-text-color-primary">
            Page {pagination.page} of {pagination.totalPages}
          </span>

          <oj-button
            chroming="callToAction"
            onojAction={goToNextPage}
            disabled={!pagination.hasNextPage}
          >
            Next
            <span slot="endIcon" class="oj-ux-ico-arrow-right"></span>
          </oj-button>
        </div>
      )}

      <oj-c-message-toast
        data={messageDataProvider}
        onojClose={closeMessage}
        position="top-right"
        offset={{ horizontal: 10, vertical: 50 }}
      />
    </div>
  );
};

export default Logs;
