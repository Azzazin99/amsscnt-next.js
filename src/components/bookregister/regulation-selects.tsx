import {
  OFFICE_TYPES,
  SECRET_LEVELS,
  URGENCY_LEVELS,
} from "@/lib/bookregister/regulation-fields";

const selectClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type SelectFieldProps = {
  id: string;
  name: string;
  label: string;
  defaultValue?: number;
};

export function UrgencyLevelSelect({
  id,
  name,
  label,
  defaultValue = 1,
}: SelectFieldProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <select
        id={id}
        name={name}
        defaultValue={defaultValue}
        className={selectClass}
      >
        {URGENCY_LEVELS.map((level) => (
          <option key={level.value} value={level.value}>
            {level.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function SecretLevelSelect({
  id,
  name,
  label,
  defaultValue = 0,
}: SelectFieldProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <select
        id={id}
        name={name}
        defaultValue={defaultValue}
        className={selectClass}
      >
        {SECRET_LEVELS.map((level) => (
          <option key={level.value} value={level.value}>
            {level.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function OfficeTypeSelect({
  id,
  name,
  label,
  defaultValue = 1,
}: SelectFieldProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <select
        id={id}
        name={name}
        defaultValue={defaultValue}
        className={selectClass}
      >
        {OFFICE_TYPES.map((type) => (
          <option key={type.value} value={type.value}>
            {type.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function RecordTypeSelect({
  id,
  name,
  defaultValue = 1,
  disabled,
}: {
  id: string;
  name: string;
  defaultValue?: number;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium">
        ประเภททะเบียนรับ
      </label>
      <select
        id={id}
        name={name}
        defaultValue={defaultValue}
        disabled={disabled}
        className={selectClass}
      >
        <option value={1}>หนังสือรับทั่วไป</option>
        <option value={2}>หนังสือรับอื่น</option>
      </select>
    </div>
  );
}
