type SettingsHeaderSectionProps = {
  title: string
}

export function SettingsHeaderSection({ title }: SettingsHeaderSectionProps) {
  return <h2 className="text-xl font-bold leading-tight sm:text-2xl">{title}</h2>
}
