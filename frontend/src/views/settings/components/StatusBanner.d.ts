type StatusBannerProps = {
    title: string;
    description: string;
    iconClass: string;
    iconColorClass: string;
    titleColorClass: string;
    descriptionColorClass: string;
    backgroundClass: string;
    selectBgClass: string;
    selectData: any;
    selectValue: any;
    onSelectChange: (event: CustomEvent) => void;
    selectLabel?: string;
    unitLabel?: string;
};
export declare function getStatusBanner({ title, description, iconClass, iconColorClass, titleColorClass, descriptionColorClass, backgroundClass, selectBgClass, selectData, selectValue, onSelectChange, selectLabel, unitLabel }: StatusBannerProps): import("preact").JSX.Element;
export {};
