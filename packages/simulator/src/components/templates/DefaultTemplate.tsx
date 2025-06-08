import type { RouteSectionProps } from '@solidjs/router';
import type { Component } from 'solid-js';
import { Suspense } from 'solid-js';

/**
 * The default template component.
 * @param props The properties.
 * @returns The component.
 */
export const DefaultTemplate: Component<
  Readonly<Pick<RouteSectionProps, 'children'>>
> = (props) => (
  <Suspense>
    <main>{props.children}</main>
  </Suspense>
);
