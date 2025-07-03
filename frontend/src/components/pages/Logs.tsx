// File: src/pages/Logs.tsx
import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import 'ojs/ojtable';
import 'ojs/ojbutton';
import ArrayDataProvider = require('ojs/ojarraydataprovider');

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

      // Protect against undefined values
      setAdminLogs(data.logs || []);
      setPagination(data.pagination || {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      });

      setDataProvider(new ArrayDataProvider(data.logs || [], { keyAttributes: '_id' }));
    } catch (error) {
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
      <div class="oj-flex oj-sm-12 oj-sm-margin-4x oj-sm-justify-content-space-between oj-sm-align-items-center">
        <h1 class="oj-typography-heading-md">Logs</h1>
      </div>

      <div style={{
        flex: 1,
        minHeight: 0,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column'
      }}>
        <oj-c-table
          data={dataProvider}
          columns={{
            "App Name": { field: 'app_name', headerText: 'App Name' },
            "Log Type": { field: 'log_type', headerText: 'Log Type' },
            "Message": { field: 'message', headerText: 'Message', tooltip: 'enabled' },
            "Timestamp": { field: 'timestamp', headerText: 'Timestamp' },
          }}
          class="oj-sm-12"
          layout="fixed"
          horizontal-grid-visible="enabled"
          vertical-grid-visible="enabled"
          style="font-size: 0.85rem; width: 100%; flex: 1 1 0; min-width: 0; min-height: 0;"
        ></oj-c-table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div class="oj-flex oj-lg-padding-horizontal-10x oj-sm-justify-content-flex-end oj-sm-flex-direction-row">
          <oj-button onojAction={goToPrevPage} disabled={!pagination.hasPrevPage}>Previous</oj-button>
          <span class="oj-typography-body-sm">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <oj-button onojAction={goToNextPage} disabled={!pagination.hasNextPage}>Next</oj-button>
        </div>
      )}
    </div>
  );
};

export default Logs;
