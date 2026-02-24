import { Header } from './header'
import { Main } from './main'

type PageLayoutProps = {
  title: string
  description?: string
  children?: React.ReactNode
}

/**
 * Standard page layout: Header + Main with title.
 * Use for authenticated pages.
 */
export function PageLayout({ title, description, children }: PageLayoutProps) {
  return (
    <>
      <Header />
      <Main>
        <div className='space-y-2'>
          <h1 className='text-2xl font-bold tracking-tight'>{title}</h1>
          {description && (
            <p className='text-muted-foreground'>{description}</p>
          )}
        </div>
        {children && <div className='mt-6'>{children}</div>}
      </Main>
    </>
  )
}
