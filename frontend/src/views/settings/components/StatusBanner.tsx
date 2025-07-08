// {/* <div class="oj-web-applayout-max-width oj-web-applayout-content oj-panel">
//         <h3 class="oj-flex">
//           <span class="oj-ux-ico-warning oj-text-color-secondary oj-typography-heading-sm"></span>
//           <span class="oj-typography-heading-sm oj-text-color-secondary">Alert Thresholds</span>
//         </h3>
//         <div class="oj-web-applayout-max-width oj-web-applayout-content oj-panel oj-bg-danger-30 oj-flex ">
//           {/* <h4 > */}
//           <div
//             class="  oj-ux-icon oj-ux-ico-exclamation oj-typography-heading-sm oj-sm-align-self-center oj-text-color-danger "
//             style=" margin-right: 8px;"
//           ></div>
//           <div class="oj-flex-item oj-sm-align-items-flex-end">
//             <h4 class="oj-typography-body-md oj-text-color-danger">
//               At Risk Apps (Error Threshold)
//             </h4>
//             {/* </h4> */}
//             <p class="oj-typography-body-sm oj-text-color-danger" style="opacity: 0.7;">
//               Configure database retention and system thresholds
//             </p>
//           </div>
//           <div class="oj-flex-item oj-sm-align-self-center oj-lg-3 oj-bg-warning oj-flex oj-sm-justify-content-space-between">
//             <oj-select-single
//               class="oj-flex-item oj-sm-8"
//               id="retentionPeriod"
//               labelHint="Retention Period"
//               data={dp}
//               value={retentionPeriod.value}
//               onvalueChanged={onChange}
//             ></oj-select-single>
//             <div class="oj-flex-item oj-sm-3 oj-sm-align-self-center">logs / min</div>
//           </div>
//         </div>
//       </div> */}
import { NumberConverter, IntlNumberConverter } from 'ojs/ojconverter-number'
import "oj-c/input-number"
import AsyncValidators = require('ojs/ojasyncvalidator-required')

const integerValidator = {
  validate: (value: number) => {
    if (!Number.isInteger(value)) {
      throw new Error('Please enter an integer value only.')
    }
    return true
  }
}

type StatusBannerProps = {
  title: string;
  description: string;
  iconClass: string;
  iconColorClass: string;
  titleColorClass: string;
  descriptionColorClass: string;
  backgroundClass: string;
  selectBgClass: string;
//   selectData: any; // Replace `any` with the actual type of your data provider if available
  selectValue: any; // Replace with the correct type of your value
  onSelectChange: (event: CustomEvent) => void;
  selectLabel?: string;
  unitLabel?: string;
  max: number;
  value:string;
};
export function getStatusBanner({
  title,
  description,
  iconClass,
  iconColorClass,
  titleColorClass,
  descriptionColorClass,
  backgroundClass,
  selectBgClass,
//   selectData,
  selectValue,
  onSelectChange,
  selectLabel = 'Retention Period',
  unitLabel = 'logs / min',
  max,
  value

}: StatusBannerProps) {
  return (
    <div className={`oj-web-applayout-max-width oj-web-applayout-content oj-panel ${backgroundClass} oj-flex`}>
      <div
        className={`oj-ux-icon ${iconClass} oj-typography-heading-sm oj-sm-align-self-center ${iconColorClass}`}
        style={{ marginRight: '8px' }}
      ></div>

      <div className="oj-flex-item oj-sm-align-items-flex-end">
        <h4 className={`oj-typography-body-md ${titleColorClass}`}>
          {title}
        </h4>
        <p className={`oj-typography-body-sm ${descriptionColorClass}`} style={{ opacity: 0.7 }}>
          {description}
        </p>
      </div>

      <div className={`oj-flex-item oj-sm-align-self-center oj-lg-3 ${selectBgClass} oj-flex oj-sm-justify-content-space-between`}>
        <oj-c-input-number 
            class="oj-flex-item oj-sm-8"
            id={value}
            labelHint={`min=1, max=${max}`}
            value={selectValue}
            onvalueChanged={onSelectChange}
            min={1}
            max={max}
            step={1}
            inputMode="numeric"
            validators={[integerValidator]}
        ></oj-c-input-number>
        {/* <oj-select-single
          class="oj-flex-item oj-sm-8"
          id="retentionPeriod"
          label-hint={selectLabel}
          data={selectData}
          value={selectValue}
          onvalueChanged={onSelectChange}
        ></oj-select-single> */}
        <div className="oj-flex-item oj-sm-3 oj-sm-align-self-center">{unitLabel}</div>
      </div>
    </div>
  );
}
