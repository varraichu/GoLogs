import { h } from 'preact';
import 'ojs/ojchart';
import { ojChart } from "ojs/ojchart";
import { useEffect, useState } from 'preact/hooks';
import { dashboardService, AppLogSummary } from '../../../services/dashboard.services';
import MutableArrayDataProvider = require("ojs/ojmutablearraydataprovider");
import { useUser } from '../../../context/UserContext';

type ChartItem = {
    id: number;
    series: string;
    group: string;
    value: number;
};

const LogGraph = () => {
    const { user } = useUser();
    const [dataProvider, setDataProvider] = useState<MutableArrayDataProvider<string, ChartItem>>();
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchData = async () => {
        try {
            if (!user) {
                console.log('User not authenticated');
                return;
            }
            const res = await dashboardService.fetchLogSummary(user);
            const rawData: AppLogSummary[] = res.data;

            const chartData = rawData.flatMap((app: AppLogSummary) => {
                const appNameFormatted = app.app_name?.replace(/\./g, ' ') || '';
                return ['info', 'warn', 'error', 'debug'].map(level => ({
                    id: `${app._id}-${level}`,
                    group: appNameFormatted,
                    series: level,
                    value: app[level as keyof AppLogSummary] ?? 0,
                }));
            });

            const provider = new MutableArrayDataProvider<string, ChartItem>(chartData, {
                keyAttributes: 'id',
            });

            setDataProvider(provider);
        } catch (err) {
            console.error('Failed to fetch log summary', err);
        }
    };

    const refreshData = async () => {
        setIsRefreshing(true);
        try {
            await dashboardService.refreshLogSummary(); // refresh backend data
            await fetchData(); // then reload chart
        } catch (err) {
            console.error('Failed to refresh data', err);
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 3600000); // every 1 hour
        return () => clearInterval(interval);
    }, []);

    const chartItem = (
        item: ojChart.ItemTemplateContext<ChartItem["id"], ChartItem>
    ) => (
        <oj-chart-item
            value={item.data.value}
            groupId={[item.data.group]}
            seriesId={item.data.series}
        ></oj-chart-item>
    );

    return (
        <div style={{ width: '100%' }}>
            <div class="oj-flex oj-flex-direction-col oj-sm-align-items-center oj-sm-justify-content-space-between oj-sm-margin-1x-bottom">
                <div class="oj-flex oj-flex-direction-col oj-sm-align-items-center" style={{ gap: '0.5rem' }}>
                    <span
                        class="oj-ux-ico-trending-up"
                        style={{
                            color: "#000000",
                            fontSize: "1.5rem",
                            fontFamily: "ojuxIconFont !important"
                        }}
                    ></span>
                    <h3 style={{ margin: 0, fontWeight: "bold", fontSize: "1.3rem" }}>
                        Logs in the past 24 hours
                    </h3>
                </div>
                <oj-button
                    onojAction={refreshData}
                    chroming="callToAction"
                    class="oj-button-sm"
                    disabled={isRefreshing}
                >
                    {isRefreshing ? "Refreshing..." : "Refresh"}
                </oj-button>
            </div>

            <oj-chart
                id="bar-chart"
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

