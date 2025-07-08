// File: src/pages/components/SearchBar.tsx
import { h } from 'preact';
import { useRef } from 'preact/hooks';
import 'ojs/ojinputsearch';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  data: any;
}

const SearchBar = ({ value, onChange, data }: SearchBarProps) => {
  const handleInput = (event: CustomEvent) => {
    const newValue = event.detail.value;
    onChange(newValue);
  };


  return (
    <div class="oj-sm-padding-4x-start oj-sm-padding-4x-end oj-flex oj-sm-align-items-center">
      <oj-input-search
        value={value}
        placeholder="Search logs"
        onojValueAction={handleInput}
        suggestions={data}
        class="oj-form-control-max-width-md"
      ></oj-input-search>
    </div>
  );
};

export default SearchBar;
