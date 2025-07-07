import { useEffect, useState } from "preact/hooks";

interface CriticalLogs {
  totalLogs: number;
  errorLogs: number;
  warningLogs: number;
}

interface Application {
  _id: string;
  name: string;
  description: string;
  isPinned: boolean;
  is_active: boolean;
  logCount: number;
  created_at: string;
  criticalLogs: CriticalLogs;  // Ensuring criticalLogs is always a part of the Application interface
}

const Dashboard = (props: { path?: string }) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [userId, setUserId] = useState("");

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const token = localStorage.getItem('jwt');
      if (token) {
        const base64Payload = token.split('.')[1]; // Get the payload part
        const payload = JSON.parse(atob(base64Payload)); // Decode from base64
        const userId = payload._id;
        setUserId(userId); // Set the userId here

        const res = await fetch(`http://localhost:3001/api/applications/${userId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const data = await res.json();
        setApplications(data.applications || []);
        // Fetch critical logs for each app after fetching applications
        fetchCriticalLogs(data.applications || []);
      } else {
        console.warn('JWT token not found in localStorage');
      }
    } catch (error) {
      console.error("Failed to fetch applications", error);
    }
  };

const fetchCriticalLogs = async (applications: Application[]) => {
  const token = localStorage.getItem('jwt');
  if (!token) {
    console.warn('JWT token not found in localStorage');
    return;
  }

  const updatedApps = await Promise.all(applications.map(async (app) => {
    try {
      const res = await fetch(`http://localhost:3001/api/applications/logs/critical/${app._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!res.ok) {
        throw new Error(`Failed to fetch logs for app ${app._id}`);
      }
      
      const criticalLogs = await res.json();

      console.log(`Fetched logs for ${app.name} (${app._id}):`, criticalLogs);

      return {
        ...app,
        criticalLogs: {
          totalLogs: criticalLogs.totalLogs ?? 0,
          errorLogs: criticalLogs.errorLogs ?? 0,
          warningLogs: criticalLogs.warningLogs ?? 0,
        },
      };
    } catch (error) {
      console.error(`Error fetching logs for app ${app._id}:`, error);
      return {
        ...app,
        criticalLogs: {
          totalLogs: 0,
          errorLogs: 0,
          warningLogs: 0,
        },
      };
    }
  }));

  setApplications(updatedApps);
};

  // Filter the pinned applications
  const pinnedApplications = applications.filter((app) => app.isPinned);

return (
  <div class="oj-flex oj-sm-padding-4x">
    {/* Header with visible pin icon */}
    <div class="oj-flex oj-sm-12 oj-sm-margin-bottom-2x oj-sm-justify-content-space-between oj-sm-align-items-center"
        style={{ marginBottom: "12px" }}>  {/* Added this line */}
      <div class="oj-flex oj-sm-align-items-center" style={{ gap: "4px" }}>
        <span class="oj-ux-ico-pin" style={{ 
          color: "#808080", 
          fontSize: "1rem",
          fontFamily: "ojuxIconFont !important" 
        }}></span>
        <h3 style={{ 
          margin: 0, 
          fontWeight: "bold",
          fontSize: "1rem"
        }}>Pinned Applications</h3>
      </div>
    </div>


    <div
      class="oj-flex oj-flex-wrap"
      style={{
        gap: "16px",
        width: "100%",
      }}
    >
      {pinnedApplications.length > 0 ? (
        pinnedApplications.map((app) => (
          <div
            key={app._id}
            class="oj-panel oj-panel-shadow-md"
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              padding: "12px 16px",
              flex: "1 1 calc(33.333% - 16px)",
              minWidth: "300px",
              maxWidth: "calc(33.333% - 16px)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-start",
              fontSize: "0.85rem",
              boxSizing: "border-box",
            }}
          >
            {/* Header: Name + Status */}
            <div
              class="oj-flex"
              style={{
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "8px",
              }}
            >
              <h3
                style={{
                  margin: "0",
                  wordBreak: "break-word",
                  fontSize: "0.95rem",
                  fontWeight: "600",
                  lineHeight: "1.2",
                  color: "#111827"
                }}
              >
                {app.name}
              </h3>
              <span
                class="oj-typography-body-xs"
                style={{
                  padding: "2px 8px",
                  fontWeight: "500",
                  color: app.is_active ? "#065f46" : "#991b1b",
                  fontSize: "0.75rem",
                  backgroundColor: app.is_active ? "#e6ffed" : "#ffebeb",
                  borderRadius: "4px",
                  lineHeight: "1.2",
                }}
              >
                {app.is_active ? "Active" : "Inactive"}
              </span>
            </div>

            {/* App Description */}
            <p
              style={{
                fontSize: "0.8rem",
                color: "#6b7280",
                marginBottom: "12px",
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: "2",
                WebkitBoxOrient: "vertical",
              }}
            >
              {app.description || "No description available"}
            </p>

            {/* Log metrics with right-aligned numbers */}
            <div style={{ marginBottom: "12px" }}>
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between",
                alignItems: "center", 
                marginBottom: "4px" 
              }}>
                <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                  <span style={{ color: "black", marginRight: "4px" }}>●</span>
                  Total Logs
                </span>
                <span style={{ fontSize: "1rem", fontWeight: "600" }}>
                  {app.criticalLogs?.totalLogs?.toLocaleString() || 0}
                </span>
              </div>
              
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between",
                alignItems: "center", 
                marginBottom: "4px" 
              }}>
                <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                  <span style={{ color: "red", marginRight: "4px" }}>●</span>
                  Errors
                </span>
                <span style={{ fontSize: "0.9rem", fontWeight: "600", color: "red" }}>
                  {app.criticalLogs?.errorLogs?.toLocaleString() || 0}
                </span>
              </div>
              
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between",
                alignItems: "center" 
              }}>
                <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                  <span style={{ color: "orange", marginRight: "4px" }}>●</span>
                  Warnings
                </span>
                <span style={{ fontSize: "0.9rem", fontWeight: "600", color: "orange" }}>
                  {app.criticalLogs?.warningLogs?.toLocaleString() || 0}
                </span>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div class="oj-typography-body-md oj-sm-margin-4x">No pinned applications available.</div>
      )}
    </div>
  </div>
);
};

export default Dashboard;

