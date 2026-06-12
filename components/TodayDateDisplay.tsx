"use client";

import UzbekDatePicker, { toPickerString } from "./UzbekDatePicker";

/**
 * Read-only Uzbek calendar display for dashboard headers.
 * Use this in Server Components where you can't pass onChange={() => {}}.
 */
export default function TodayDateDisplay({ triggerStyle }: { triggerStyle?: React.CSSProperties }) {
  const today = toPickerString(new Date());
  return (
    <UzbekDatePicker
      value={today}
      onChange={() => {}}
      readOnly
      includeTime={false}
      triggerStyle={triggerStyle}
    />
  );
}
