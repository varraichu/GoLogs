import { h } from 'preact';
import 'ojs/ojchart';
import { ojChart } from "ojs/ojchart";
import { useEffect, useState } from 'preact/hooks';
import { dashboardService, AppLogSummary } from '../../../services/dashboard.services';
import MutableArrayDataProvider = require("ojs/ojmutablearraydataprovider");

type ChartItem = {
    id: number;
    series: string;
    group: string;
    value: number;
};

const LogGraph = () => {

    const [dataProvider, setDataProvider] = useState<MutableArrayDataProvider<string, ChartItem>>();
    useEffect(() => {
        dashboardService.fetchLogSummary()
            .then(res => {
                const rawData: AppLogSummary[] = res.data;

                const chartData = rawData.flatMap((app: AppLogSummary) => {
                    return ['info', 'warn', 'error', 'debug'].map(level => ({
                        id: `${app._id}-${level}`,
                        group: app.app_name,
                        series: level,
                        value: app[level as keyof AppLogSummary] ?? 0, // fallback to 0 if undefined
                    }));
                });

                const provider = new MutableArrayDataProvider<string, ChartItem>(chartData, {
                    keyAttributes: 'id'
                });

                setDataProvider(provider);
            })
            .catch(err => {
                console.error('Failed to load dashboard summary', err);
            });
    }, []);

    const chartItem = (
        item: ojChart.ItemTemplateContext<ChartItem["id"], ChartItem>
    ) => {
        return (
            <oj-chart-item
                value={item.data.value}
                groupId={[item.data.group]}
                seriesId={item.data.series}></oj-chart-item>
        );
    };

    return (
        <div>
            <oj-chart
                id='bar-chart'
                type="bar"
                orientation="horizontal"
                stack="on"
                data={dataProvider}
                animation-on-display="auto"
                animation-on-data-change="auto"
                hover-behavior="dim"
            >
                <template slot="itemTemplate" render={chartItem}></template>
            </oj-chart>
        </div>
    );
};

export default LogGraph;
