import { Directive } from '@angular/core';
import { IDetailsDirectiveContext } from '../interfaces/details.interfaces';

@Directive({
  selector: '[gridDetails]',
  standalone: true,
})
export class DetailsDirective<TContext> {
  public static ngTemplateContextGuard<TContext>(
    dir: DetailsDirective<TContext>,
    ctx: unknown
  ): ctx is IDetailsDirectiveContext<TContext> {
    return true;
  }
}
