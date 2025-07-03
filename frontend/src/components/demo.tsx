import { h } from "preact";
import { useState, useMemo } from "preact/hooks";
import "oj-c/message-toast";
import "oj-c/button";
import "oj-c/select-single";
import "oj-c/checkboxset";
import "oj-c/form-layout";
import ArrayDataProvider = require("ojs/ojarraydataprovider");

type Message = {
  id: string;
  severity: string;
  summary: string;
  detail: string;
  autoTimeout: string | number;
  sound: string;
};

type TimeoutOption = {
  label: string;
  value: string | number;
};

type SoundOption = {
  label: string;
  value: string;
};

const timeoutOptions: TimeoutOption[] = [
  { label: "on (theme default 5s)", value: "on" },
  { label: "off", value: "off" },
  { label: "5s", value: 5000 },
  { label: "7s", value: 7000 },
  { label: "10s", value: 10000 },
  { label: "20s", value: 20000 },
];

const soundOptions: SoundOption[] = [
  { label: "Include sound", value: "default" }
];

export default function MessageToastVDOM() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [autoTimeout, setAutoTimeout] = useState<string | number>("on");
  const [soundValue, setSoundValue] = useState<string[]>([]);
  const [counter, setCounter] = useState<number>(0);

  // DataProviders
  const messageDataProvider = useMemo(
    () => new ArrayDataProvider(messages, { keyAttributes: "id" }),
    [messages]
  );
  const timeoutDataProvider = useMemo(
    () => new ArrayDataProvider(timeoutOptions, { keyAttributes: "value" }),
    []
  );
  const soundDataProvider = useMemo(
    () => new ArrayDataProvider(soundOptions, { keyAttributes: "value" }),
    []
  );

  const addNewToast = () => {
    const newCounter = counter + 1;
    const newMsg: Message = {
      id: `newMessage${newCounter}`,
      severity: "info",
      summary: `New toast message - ${newCounter}`,
      detail: "Secondary text",
      autoTimeout,
      sound: soundValue.includes("default") ? "default" : "none",
    };
    setMessages([...messages, newMsg]);
    setCounter(newCounter);
  };

  const closeMessage = (event: CustomEvent<{ key: string }>) => {
    const closeKey = event.detail.key;
    setMessages(messages.filter((msg) => msg.id !== closeKey));
  };

  return (
    <div class="p-4">
      <oj-c-message-toast
        data={messageDataProvider}
        onojClose={closeMessage}
      />

      <h6>Auto-timeout and sound options for the new toast</h6>
      <oj-c-form-layout>
        <oj-c-select-single
          labelHint="autoTimeout"
          value={autoTimeout}
          onvalueChanged={(e: CustomEvent<{ value: string | number }>) => setAutoTimeout(e.detail.value)}
          data={timeoutDataProvider}
          itemText="label"
        />
        <oj-c-checkboxset
          labelHint="Sound Property"
          labelEdge="none"
          value={soundValue}
          options={soundDataProvider}
          onvalueChanged={(e: CustomEvent<{ value: any[] | null | undefined }>) => setSoundValue(e.detail.value ?? [])}
        />
        <oj-button onojAction={addNewToast} label="Open new toast" />
      </oj-c-form-layout>
    </div>
  );
}
