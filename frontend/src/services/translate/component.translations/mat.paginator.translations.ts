import { MatPaginatorIntl } from '@angular/material/paginator';
import { TranslationService } from '../translation.service';

export class MatPaginatorTranslations {
  public constructor(private readonly _translationService: TranslationService) {}

  public init(): MatPaginatorIntl {
    const paginatorIntl = new MatPaginatorIntl();
    paginatorIntl.itemsPerPageLabel = this._translationService.get('Paginator/ItemsPerPageLabel');
    paginatorIntl.nextPageLabel = this._translationService.get('Paginator/NextPageLabel');
    paginatorIntl.previousPageLabel = this._translationService.get('Paginator/PreviousPageLabel');
    paginatorIntl.firstPageLabel = this._translationService.get('Paginator/FirstPageLabel');
    paginatorIntl.lastPageLabel = this._translationService.get('Paginator/LastPageLabel');
    paginatorIntl.getRangeLabel = this.getRangeLabel.bind(this);
    return paginatorIntl;
  }

  private getRangeLabel(page: number, pageSize: number, length: number): string {
    if (length === 0 || pageSize === 0) {
      return this._translationService.get('Paginator/RangePageLabel1', { length });
    }

    length = Math.max(length, 0);
    const startIndex = page * pageSize;
    const endIndex =
      startIndex < length ? Math.min(startIndex + pageSize, length) : startIndex + pageSize;
    return this._translationService.get('Paginator/RangePageLabel2', {
      startIndex: startIndex + 1,
      endIndex,
      length,
    });
  }
}
