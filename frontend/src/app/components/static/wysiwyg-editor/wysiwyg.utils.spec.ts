import { WysiwygUtils } from './wysiwyg.utils';
import { StringUtils } from 'src/utils/string.utils';

describe('WysiwygUtils', () => {
  describe('clearContent', () => {
    it('should return empty string for null input', () => {
      const result = WysiwygUtils.clearContent(null);
      expect(result).toBe('');
    });

    it('should return empty string for undefined input', () => {
      const result = WysiwygUtils.clearContent(undefined);
      expect(result).toBe('');
    });

    it('should return empty string for empty string input', () => {
      const result = WysiwygUtils.clearContent('');
      expect(result).toBe('');
    });

    it('should remove trailing empty paragraphs', () => {
      const input = 'Some content<p></p>';
      const result = WysiwygUtils.clearContent(input);
      expect(result).toBe('Some content');
    });

    it('should remove multiple trailing empty paragraphs', () => {
      const input = 'Some content<p></p><p></p><p></p>';
      const result = WysiwygUtils.clearContent(input);
      expect(result).toBe('Some content');
    });

    it('should remove trailing empty paragraphs with whitespace', () => {
      const input = 'Some content<p></p>  <p></p>  ';
      const result = WysiwygUtils.clearContent(input);
      expect(result).toBe('Some content');
    });

    it('should replace multiple non-breaking spaces with single space', () => {
      const input = 'Hello&nbsp;&nbsp;&nbsp;world';
      const result = WysiwygUtils.clearContent(input);
      expect(result).toBe('Hello world');
    });

    it('should replace mixed case non-breaking spaces', () => {
      const input = 'Hello&NBSP;&nbsp;&Nbsp;world';
      const result = WysiwygUtils.clearContent(input);
      expect(result).toBe('Hello world');
    });

    it('should trim whitespace from beginning and end', () => {
      const input = '   Hello world   ';
      const result = WysiwygUtils.clearContent(input);
      expect(result).toBe('Hello world');
    });

    it('should replace multiple whitespaces with single space', () => {
      const input = 'Hello    world    test';
      const result = WysiwygUtils.clearContent(input);
      expect(result).toBe('Hello world test');
    });

    it('should remove leading spaces after other operations', () => {
      const input = ' Hello world';
      const result = WysiwygUtils.clearContent(input);
      expect(result).toBe('Hello world');
    });

    it('should handle complex content with all transformations', () => {
      const input = '  Hello&nbsp;&nbsp;world    test  <p></p><p></p>  ';
      const result = WysiwygUtils.clearContent(input);
      expect(result).toBe('Hello world test');
    });

    it('should preserve content inside paragraphs', () => {
      const input = '<p>Hello world</p><p>Another paragraph</p><p></p>';
      const result = WysiwygUtils.clearContent(input);
      expect(result).toBe('<p>Hello world</p><p>Another paragraph</p>');
    });

    it('should handle newlines and tabs in whitespace replacement', () => {
      const input = 'Hello\n\n\tworld\r\n  test';
      const result = WysiwygUtils.clearContent(input);
      expect(result).toBe('Hello world test');
    });

    it('should handle only trailing empty paragraphs without other content', () => {
      const input = '<p></p><p></p>';
      const result = WysiwygUtils.clearContent(input);
      expect(result).toBe('');
    });

    it('should handle empty string content specifically', () => {
      const input = '';
      const result = WysiwygUtils.clearContent(input);
      expect(result).toBe('');
    });
  });

  describe('fixConjunctions', () => {
    it('should return empty string for null input', () => {
      const result = WysiwygUtils.fixConjunctions(null);
      expect(result).toBe('');
    });

    it('should return empty string for undefined input', () => {
      const result = WysiwygUtils.fixConjunctions(undefined);
      expect(result).toBe('');
    });

    it('should return empty string for empty string input', () => {
      const result = WysiwygUtils.fixConjunctions('');
      expect(result).toBe('');
    });

    it('should add non-breaking space after single letter conjunction "i"', () => {
      const input = 'Ala i Ola';
      const result = WysiwygUtils.fixConjunctions(input);
      expect(result).toBe('Ala i&nbsp;Ola');
    });

    it('should add non-breaking space after single letter conjunction "a"', () => {
      const input = 'To a tamto';
      const result = WysiwygUtils.fixConjunctions(input);
      expect(result).toBe('To a&nbsp;tamto');
    });

    it('should add non-breaking space after all single letter conjunctions', () => {
      const input = 'i a o u w z';
      const result = WysiwygUtils.fixConjunctions(input);
      expect(result).toBe('i&nbsp;a&nbsp;o&nbsp;u&nbsp;w&nbsp;z');
    });

    it('should add non-breaking space after "św" conjunction', () => {
      const input = 'św Piotr';
      const result = WysiwygUtils.fixConjunctions(input);
      expect(result).toBe('św&nbsp;Piotr');
    });

    it('should add non-breaking space after "ks" conjunction', () => {
      const input = 'ks Kowalski';
      const result = WysiwygUtils.fixConjunctions(input);
      expect(result).toBe('ks&nbsp;Kowalski');
    });

    it('should handle uppercase conjunctions', () => {
      const input = 'ALA I OLA';
      const result = WysiwygUtils.fixConjunctions(input);
      expect(result).toBe('ALA I&nbsp;OLA');
    });

    it('should handle mixed case conjunctions', () => {
      const input = 'Ala I ola';
      const result = WysiwygUtils.fixConjunctions(input);
      expect(result).toBe('Ala I&nbsp;ola');
    });

    it('should use NBSP character when useHtmlEntity is false', () => {
      const input = 'Ala i Ola';
      const result = WysiwygUtils.fixConjunctions(input, false);
      expect(result).toBe('Ala i\u00A0Ola');
    });

    it('should use HTML entity by default', () => {
      const input = 'Ala i Ola';
      const result = WysiwygUtils.fixConjunctions(input);
      expect(result).toBe('Ala i&nbsp;Ola');
    });

    it('should handle conjunctions with punctuation', () => {
      const input = 'To, a tamto.';
      const result = WysiwygUtils.fixConjunctions(input);
      expect(result).toBe('To, a&nbsp;tamto.');
    });

    it('should handle conjunction at the end of string', () => {
      const input = 'Kończy się na i';
      const result = WysiwygUtils.fixConjunctions(input);
      expect(result).toBe('Kończy się na i');
    });

    it('should handle multiple spaces after conjunction', () => {
      const input = 'Ala i   Ola';
      const result = WysiwygUtils.fixConjunctions(input);
      expect(result).toBe('Ala i&nbsp;  Ola');
    });

    it('should handle tab character after conjunction', () => {
      const input = 'Ala i\tOla';
      const result = WysiwygUtils.fixConjunctions(input);
      expect(result).toBe('Ala i&nbsp;Ola');
    });

    it('should handle newline after conjunction', () => {
      const input = 'Ala i\nOla';
      const result = WysiwygUtils.fixConjunctions(input);
      expect(result).toBe('Ala i&nbsp;Ola');
    });

    it('should handle multiple conjunctions in one text', () => {
      const input = 'Ala i Ola a także Kasia w domu z psem';
      const result = WysiwygUtils.fixConjunctions(input);
      expect(result).toBe('Ala i&nbsp;Ola a&nbsp;także Kasia w&nbsp;domu z&nbsp;psem');
    });

    it('should handle text with only whitespace tokens', () => {
      const input = '   \t  \n  ';
      const result = WysiwygUtils.fixConjunctions(input);
      expect(result).toBe('   \t  \n  ');
    });

    it('should handle text with no matches from regex', () => {
      const input = '';
      const result = WysiwygUtils.fixConjunctions(input);
      expect(result).toBe('');
    });

    it('should handle case where regex returns null', () => {
      const input = '';
      const result = WysiwygUtils.fixConjunctions(input);
      expect(result).toBe('');
    });

    it('should inject NBSP as separate token when conjunction not followed by whitespace', () => {
      const input = 'test itest';
      const result = WysiwygUtils.fixConjunctions(input);
      expect(result).toBe('test itest');
    });

    it('should handle conjunction right before the end of string without whitespace', () => {
      const input = 'koniec i';
      const result = WysiwygUtils.fixConjunctions(input);
      expect(result).toBe('koniec i');
    });

    it('should inject NBSP when conjunction followed by no whitespace but has next token', () => {
      const input = 'test i(parenthesis)';
      const result = WysiwygUtils.fixConjunctions(input);
      expect(result).toBe('test i(parenthesis)');
    });

    it('should not affect words that contain conjunctions but are not conjunctions', () => {
      const input = 'indyk awaria owca uczenie';
      const result = WysiwygUtils.fixConjunctions(input);
      expect(result).toBe('indyk awaria owca uczenie');
    });

    it('should handle conjunctions with Unicode characters', () => {
      const input = 'ąść i éłó';
      const result = WysiwygUtils.fixConjunctions(input);
      expect(result).toBe('ąść i&nbsp;éłó');
    });

    it('should handle edge case with no whitespace after conjunction', () => {
      const input = 'ialaolatamto';
      const result = WysiwygUtils.fixConjunctions(input);
      expect(result).toBe('ialaolatamto');
    });

    it('should inject NBSP when conjunction has no following whitespace but has following token', () => {
      const input = 'słowo i.kropka';
      const result = WysiwygUtils.fixConjunctions(input);
      expect(result).toBe('słowo i.kropka');
    });

    it('should handle conjunction followed by non-word characters', () => {
      const input = 'tekst a...';
      const result = WysiwygUtils.fixConjunctions(input);
      expect(result).toBe('tekst a...');
    });

    it('should preserve existing content structure', () => {
      const input = 'Tekst <strong>i</strong> tekst';
      const result = WysiwygUtils.fixConjunctions(input);
      expect(result).toBe('Tekst <strong>i</strong> tekst');
    });

    it('should handle edge case with number', () => {
      const input = '1 word word';
      const result = WysiwygUtils.fixConjunctions(input);
      expect(result).toBe('1&nbsp;word word');
    });

    it('should handle edge case with numbers', () => {
      const input = '1 word word 2 word word 3 word word';
      const result = WysiwygUtils.fixConjunctions(input);
      expect(result).toBe('1&nbsp;word word 2&nbsp;word word 3&nbsp;word word');
    });

    it('should handle edge case conjunction with numbers', () => {
      const input = '1 A word word 2 i word word 3 word word';
      const result = WysiwygUtils.fixConjunctions(input);
      expect(result).toBe('1&nbsp;A&nbsp;word word 2&nbsp;i&nbsp;word word 3&nbsp;word word');
    });

    it('should handle edge case conjunction with big numbers', () => {
      const input = '1000000 A word word 2000000 i word word 3000000 word word';
      const result = WysiwygUtils.fixConjunctions(input);
      expect(result).toBe(
        '1000000&nbsp;A&nbsp;word word 2000000&nbsp;i&nbsp;word word 3000000&nbsp;word word'
      );
    });
  });

  describe('isEmpty', () => {
    it('should return true for null input', () => {
      const result = WysiwygUtils.isEmpty(null);
      expect(result).toBe(true);
    });

    it('should return true for undefined input', () => {
      const result = WysiwygUtils.isEmpty(undefined);
      expect(result).toBe(true);
    });

    it('should return true for empty string', () => {
      const result = WysiwygUtils.isEmpty('');
      expect(result).toBe(true);
    });

    it('should return true for whitespace only string', () => {
      const result = WysiwygUtils.isEmpty('   \n\t  ');
      expect(result).toBe(true);
    });

    it('should return true for empty paragraphs only', () => {
      const result = WysiwygUtils.isEmpty('<p></p><p></p>');
      expect(result).toBe(true);
    });

    it('should return true for empty paragraphs with whitespace', () => {
      const result = WysiwygUtils.isEmpty('  <p></p>  <p></p>  ');
      expect(result).toBe(true);
    });

    it('should return true for content with only non-breaking spaces', () => {
      const result = WysiwygUtils.isEmpty('&nbsp;&nbsp;&nbsp;');
      expect(result).toBe(true);
    });

    it('should return false for non-empty content', () => {
      const result = WysiwygUtils.isEmpty('Hello world');
      expect(result).toBe(false);
    });

    it('should return false for content with actual text in paragraphs', () => {
      const result = WysiwygUtils.isEmpty('<p>Hello</p>');
      expect(result).toBe(false);
    });

    it('should return false for single meaningful character', () => {
      const result = WysiwygUtils.isEmpty('a');
      expect(result).toBe(false);
    });

    it('should use StringUtils.isEmpty internally', () => {
      spyOn(StringUtils, 'isEmpty').and.returnValue(true);
      const result = WysiwygUtils.isEmpty('test');
      expect(StringUtils.isEmpty).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should call clearContent before checking with StringUtils', () => {
      spyOn(WysiwygUtils, 'clearContent').and.returnValue('cleaned');
      spyOn(StringUtils, 'isEmpty').and.returnValue(false);

      const result = WysiwygUtils.isEmpty('<p></p>test<p></p>');

      expect(WysiwygUtils.clearContent).toHaveBeenCalledWith('<p></p>test<p></p>');
      expect(StringUtils.isEmpty).toHaveBeenCalledWith('cleaned');
      expect(result).toBe(false);
    });

    it('should return true when content is falsy but not explicitly null or undefined', () => {
      // Test coverage dla pierwszej gałęzi w isEmpty: !content
      const result = WysiwygUtils.isEmpty(false as any);
      expect(result).toBe(true);
    });

    it('should handle complex HTML content', () => {
      const complexHtml = `
        <div>
          <p></p>
          <span>&nbsp;</span>
          <p></p>
        </div>
      `;
      const result = WysiwygUtils.isEmpty(complexHtml);
      expect(result).toBe(false);
    });
  });

  describe('edge cases and integration tests', () => {
    it('should handle all methods together in a realistic scenario', () => {
      const input = '  <p>Ala i Ola</p>&nbsp;&nbsp;<p></p>  ';

      // Test clearContent
      const cleared = WysiwygUtils.clearContent(input);
      expect(cleared).toBe('<p>Ala i Ola</p>');

      // Test fixConjunctions
      const fixed = WysiwygUtils.fixConjunctions(cleared);
      expect(fixed).toBe('<p>Ala i&nbsp;Ola</p>');

      // Test isEmpty
      const empty = WysiwygUtils.isEmpty(input);
      expect(empty).toBe(false);
    });

    it('should handle Unicode characters correctly in all methods', () => {
      const input = 'Ćwiczenia ą ę ł ś ć ż ź';

      const cleared = WysiwygUtils.clearContent(input);
      expect(cleared).toBe('Ćwiczenia ą ę ł ś ć ż ź');

      const fixed = WysiwygUtils.fixConjunctions(cleared);
      expect(fixed).toBe('Ćwiczenia ą ę ł ś ć ż ź');

      const empty = WysiwygUtils.isEmpty(input);
      expect(empty).toBe(false);
    });

    it('should handle extremely large strings efficiently', () => {
      const largeString = 'Ala i Ola '.repeat(1000);

      expect(() => {
        WysiwygUtils.clearContent(largeString);
        WysiwygUtils.fixConjunctions(largeString);
        WysiwygUtils.isEmpty(largeString);
      }).not.toThrow();
    });

    it('should handle strings with mixed content types', () => {
      const mixedContent = `
        <p>Paragraph with i conjunction</p>
        <ul>
          <li>List item z preposition</li>
          <li>Another item a conjunction</li>
        </ul>
        <div>&nbsp;&nbsp;</div>
        <p></p>
      `;

      const cleared = WysiwygUtils.clearContent(mixedContent);
      const fixed = WysiwygUtils.fixConjunctions(cleared);
      const empty = WysiwygUtils.isEmpty(mixedContent);

      expect(cleared).toContain('<p>Paragraph with i conjunction</p>');
      expect(fixed).toContain('i&nbsp;conjunction');
      expect(fixed).toContain('z&nbsp;preposition');
      expect(fixed).toContain('a&nbsp;conjunction');
      expect(empty).toBe(false);
    });

    it('should handle mixed content with HTML tags', () => {
      const mixedContent =
        '<p>word word i word i word word</p><p>Click this link <a href="https://domain.com/form/1" rel="noopener noreferrer" target="_blank">https://domain.com/form/1</a></p>';

      const cleared = WysiwygUtils.clearContent(mixedContent);
      const fixed = WysiwygUtils.fixConjunctions(cleared);
      const empty = WysiwygUtils.isEmpty(mixedContent);

      expect(cleared).toBe(
        '<p>word word i word i word word</p><p>Click this link <a href="https://domain.com/form/1" rel="noopener noreferrer" target="_blank">https://domain.com/form/1</a></p>'
      );
      expect(fixed).toBe(
        '<p>word word i&nbsp;word i&nbsp;word word</p><p>Click this link <a href="https://domain.com/form/1" rel="noopener noreferrer" target="_blank">https://domain.com/form/1</a></p>'
      );
      expect(empty).toBe(false);
    });
  });
});
