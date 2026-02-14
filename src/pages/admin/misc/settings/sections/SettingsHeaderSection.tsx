type SettingsHeaderSectionProps = {
  title: string
}

export function SettingsHeaderSection({ title }: SettingsHeaderSectionProps) {
  return <h2 className="text-2xl font-bold">{title}</h2>
}
