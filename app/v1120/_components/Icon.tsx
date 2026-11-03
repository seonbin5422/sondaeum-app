// Figma wireframe-1128 아이콘(Material Symbols Rounded 채움, public/v1120/icons). 색은 글자색(currentColor)을 따른다
export type IconName =
  | "add" | "arrow_back" | "auto_awesome" | "call" | "chat_bubble" | "check" | "check_circle" | "chevron_left"
  | "chevron_right" | "close" | "content_copy" | "delete" | "edit" | "edit_note" | "error" | "expand_less"
  | "expand_more" | "history" | "info" | "lock" | "logout" | "person_add" | "picture_as_pdf" | "print"
  | "radio_button_unchecked" | "refresh" | "schedule" | "send" | "shield" | "sms" | "stop" | "upload_file";

export function Icon({ name, size = 24, className = "" }: { name: IconName; size?: number; className?: string }) {
  const url = `url(/v1120/icons/${name}.svg)`;
  return (
    <span
      aria-hidden
      className={`inline-block shrink-0 bg-current ${className}`}
      style={{ width: size, height: size, maskImage: url, WebkitMaskImage: url, maskSize: "100% 100%", WebkitMaskSize: "100% 100%" }}
    />
  );
}
