// views/CardView.tsx
import { h } from "preact";
import MutableArrayDataProvider = require("ojs/ojmutablearraydataprovider");
import "oj-c/card-view";
import { renderCardItem } from "./CardItem";
import { Application } from "./CardItem";

type CardViewProps = {
//   employees: Employee[];
application:Application[]
};

export function CardView({ application
 }: CardViewProps) {
  const dataProvider = new MutableArrayDataProvider(application, {
    keyAttributes: "_id"
  });

  return (
    <oj-c-card-view data={dataProvider}>
      <template slot="itemTemplate" render={renderCardItem}></template>
    </oj-c-card-view>
  );
}
