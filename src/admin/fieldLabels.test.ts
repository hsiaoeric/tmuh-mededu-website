import { describe, expect, it } from 'vitest';
import { shortFieldLabel } from './fieldLabels';

describe('shortFieldLabel', () => {
  it('drops the clause naming the item the card already shows', () => {
    expect(shortFieldLabel('公告日期，第 1 則公告', 1, false)).toBe('公告日期');
    expect(shortFieldLabel('English title, announcement 12', 12, false)).toBe('English title');
    expect(shortFieldLabel('SNQ 專案 3 標章文字（繁體中文）', 3, true)).toBe('標章文字');
  });

  it('keeps numbers that are not the item position', () => {
    expect(shortFieldLabel('公告日期，第 1 則公告', 2, false)).toBe('公告日期，第 1 則公告');
    expect(shortFieldLabel('2024 年度 標題', 1, false)).toBe('2024 年度 標題');
  });

  it('drops the language inside a bilingual pair only', () => {
    expect(shortFieldLabel('頁面眉標（繁體中文）', null, true)).toBe('頁面眉標');
    expect(shortFieldLabel('頁面眉標（英文）', null, false)).toBe('頁面眉標（英文）');
  });

  it('never shortens a label to nothing', () => {
    expect(shortFieldLabel('第 1 則', 1, false)).toBe('第 1 則');
  });
});
