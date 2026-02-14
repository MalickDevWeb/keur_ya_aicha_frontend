type RentalsFooterSectionProps = {
  total: number
}

export function RentalsFooterSection({ total }: RentalsFooterSectionProps) {
  return (
    <div className="mt-6 pt-6 border-t text-sm text-muted-foreground text-center">
      Affichage de <span className="font-semibold">{total}</span> location{total > 1 ? 's' : ''}
    </div>
  )
}
