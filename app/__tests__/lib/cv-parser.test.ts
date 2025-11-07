import { describe, it, expect } from 'vitest';
import { normalizeCompanyName, extractKeywords } from '@/lib/cv-parser';

describe('CV Parser', () => {
  describe('normalizeCompanyName', () => {
    it('should normalize known subsidiaries', () => {
      expect(normalizeCompanyName('Google')).toBe('alphabet');
      expect(normalizeCompanyName('YouTube')).toBe('alphabet');
      expect(normalizeCompanyName('Facebook')).toBe('meta');
      expect(normalizeCompanyName('Instagram')).toBe('meta');
    });

    it('should lowercase and trim company names', () => {
      expect(normalizeCompanyName('  Apple  ')).toBe('apple');
      expect(normalizeCompanyName('MICROSOFT')).toBe('microsoft');
    });

    it('should handle unknown companies', () => {
      expect(normalizeCompanyName('StartupCo')).toBe('startupco');
    });

    it('should be case insensitive for subsidiaries', () => {
      expect(normalizeCompanyName('google')).toBe('alphabet');
      expect(normalizeCompanyName('GOOGLE')).toBe('alphabet');
      expect(normalizeCompanyName('GoOgLe')).toBe('alphabet');
    });
  });

  describe('extractKeywords', () => {
    it('should extract keywords from text', () => {
      const text = 'Business operations management strategy planning';
      const keywords = extractKeywords(text);
      
      expect(keywords).toContain('business');
      expect(keywords).toContain('operations');
      expect(keywords).toContain('management');
      expect(keywords).toContain('strategy');
      expect(keywords).toContain('planning');
    });

    it('should filter out stop words', () => {
      const text = 'The business and the management';
      const keywords = extractKeywords(text);
      
      expect(keywords).not.toContain('the');
      expect(keywords).not.toContain('and');
      expect(keywords).toContain('business');
      expect(keywords).toContain('management');
    });

    it('should filter out short words', () => {
      const text = 'AI is a big AI technology AI field';
      const keywords = extractKeywords(text);
      
      expect(keywords).not.toContain('is');
      expect(keywords).not.toContain('a');
      expect(keywords).toContain('technology');
      expect(keywords).toContain('field');
    });

    it('should return limited number of keywords', () => {
      const longText = 'word '.repeat(100);
      const keywords = extractKeywords(longText);
      
      expect(keywords.length).toBeLessThanOrEqual(50);
    });

    it('should handle empty text', () => {
      const keywords = extractKeywords('');
      expect(keywords).toEqual([]);
    });
  });
});

