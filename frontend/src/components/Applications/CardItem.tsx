// components/CardItem.tsx
import { h } from "preact";
import { ApplicationDialog } from "./ApplicationDialog";
import { useState } from "preact/hooks";
import { ObjectId } from "mongodb";


export type Application = {
  _id: ObjectId;
  name: string;
  description: string;
  // status: "Healthy" | "Warning" | "Critical";
  // logCount: number;
  // clients: number;
  // assignedTo: string[];
  createdDate: string;
  // icon: string;
};

type Props = {
  data: Application;
};

// The template renderer function — same signature JET expects
export function renderCardItem(itemContext: { data: Application }) {
  const { data } = itemContext;
  const [isClicked, setIsClicked] = useState(false);

  // const statusStyles = {
  //   Healthy: { text: "Healthy", color: "green", dot: "🟢" },
  //   Warning: { text: "Warning", color: "orange", dot: "🟠" },
  //   Critical: { text: "Critical", color: "red", dot: "🔴" },
  // };

  // const status = statusStyles[data.status];

  return (
    <div
      class="oj-c-card "
      // style="width: 260px; height: 260px; display: flex; flex-direction: column; justify-content: space-between;"
      onClick={() => setIsClicked(true)}>

      <div class="oj-c-card-body">

        <div class="oj-flex oj-sm-align-items-center oj-sm-margin-bottom">
          <span class="oj-typography-heading-sm">{data.name}</span>
          {/* <span
            class={`oj-typography-body-sm oj-text-color-${status.color} oj-sm-margin-start`}
          >
            {status.dot} {status.text}
          </span> */}
        </div>
        <div class="oj-typography-body-sm oj-sm-margin-bottom">
          {data.description}
        </div>

        <div class="oj-flex oj-sm-margin-bottom">
          <div class="oj-flex-item oj-sm-margin-end">
            <span class="oj-typography-body-sm">
              📊 Log Count
              <br />
              {/* <b>{data.logCount}</b> */}
            </span>
          </div>
          <div class="oj-flex-item">
            <span class="oj-typography-body-sm">
              👥 Clients
              <br />
              {/* <b>{data.clients}</b> */}
            </span>
          </div>
        </div>

        {/* <div class="oj-typography-caption oj-sm-margin-bottom">
          <b>Assigned To:</b> {data.assignedTo.join(", ")}
        </div> */}

        <div class="oj-typography-caption">Created: {data.createdDate}</div>
      </div>
    
      <ApplicationDialog data={data} isCLicked={isClicked} closePopup={()=>setIsClicked(false)}></ApplicationDialog>
    </div>
  );
}
