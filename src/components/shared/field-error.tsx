type FieldErrorProps = {
  message?: string | null;
  id?: string;
};

export function FieldError({ message, id }: FieldErrorProps) {
  if (!message) return null;
  return (
    <p id={id} className="text-sm font-medium text-destructive" role="alert">
      {message}
    </p>
  );
}
