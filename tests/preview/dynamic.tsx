import React, { lazy, Suspense } from 'react'
export default function dynamic(loader: () => Promise<{ default: React.ComponentType<any> }>) {
  const Component = lazy(loader)
  return function FixtureDynamic(props: any) {
    return (
      <Suspense fallback={null}>
        <Component {...props} />
      </Suspense>
    )
  }
}
