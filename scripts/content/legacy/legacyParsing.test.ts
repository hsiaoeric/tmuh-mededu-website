import { describe, expect, it } from 'vitest';
import { classifyLegacyPath } from './classify';
import { readLegacyRoster } from './departmentPages';
import { locateImage } from './images';
import { EMPTY_HTTPS_UPGRADES, isPrivateHost, repairHref, resolveLegacyHref } from './links';
import { extractArticle, extractInlineImages, groupPostViews, inlineImage, LegacyImportError, parseHtml } from './parsePage';
import { downloadFileName, legacyLocationFromHref, legacyLocationFromMirrorFile, normalizeLegacyPath } from './paths';
import { RedirectTableBuilder, postPath, redirectTarget, type RedirectLookups } from './redirects';
import { parseLegacyDate, parseRocDate, rocDateInText, timestampDateInFileName } from './text';
import type { MirrorPage } from './walk';

function page(relativeFile: string): MirrorPage {
  return { file: `/mirror/${relativeFile}`, relativeFile, location: legacyLocationFromMirrorFile(relativeFile) };
}

describe('legacy paths', () => {
  it('restores the old URL from a wget file name, including its query', () => {
    expect(legacyLocationFromMirrorFile('news/info/n007/185.html')).toEqual({ path: '/news/info/n007/185', query: [] });
    expect(legacyLocationFromMirrorFile('news?page=3.html')).toEqual({ path: '/news', query: [['page', '3']] });
    expect(legacyLocationFromMirrorFile('other/downloadfile?fName=%2FUploadFile%2FDownload%2FFILE%2Fa.pdf')).toEqual({
      path: '/other/downloadfile',
      query: [['fName', '/UploadFile/Download/FILE/a.pdf']],
    });
  });

  it('normalizes case, trailing slashes, .html and queries for redirect keys', () => {
    expect(normalizeLegacyPath('/News/Info/N007/185.html')).toBe('/news/info/n007/185');
    expect(normalizeLegacyPath('/board/index/BOARD01/')).toBe('/board/index/board01');
    expect(normalizeLegacyPath('/news?page=2')).toBe('/news');
    expect(normalizeLegacyPath('//about//index.HTML#top')).toBe('/about/index');
    expect(normalizeLegacyPath('/UploadFile/images/%E3%80%902024%E5%B9%B4%E3%80%91/a.JPG')).toBe('/uploadfile/images/【2024年】/a.jpg');
  });

  it('resolves mirror-relative hrefs, including wget-escaped download links', () => {
    expect(legacyLocationFromHref('../../../center/events/develop/evt03.html', 'news/info/news/150.html')).toEqual({ path: '/center/events/develop/evt03', query: [] });
    const download = legacyLocationFromHref('../downloadfile%3FfName=%252FUploadFile%252FDownload%252FFILE%252Fa.pdf', 'other/download/DWN04.html');
    expect(download).toEqual({ path: '/other/downloadfile', query: [['fName', '/UploadFile/Download/FILE/a.pdf']] });
    expect(download === undefined ? undefined : downloadFileName(download)).toBe('/UploadFile/Download/FILE/a.pdf');
    expect(legacyLocationFromHref('https://tmuh-education.tmuh.org.tw/board/cate/board/board02', 'index.html')?.path).toBe('/board/cate/board/board02');
    expect(legacyLocationFromHref('https://www.acgme.org/', 'index.html')).toBeUndefined();
  });
});

describe('legacy dates', () => {
  it('parses the old post date formats', () => {
    expect(parseLegacyDate(' 2022.12.17 ')).toBe('2022-12-17');
    expect(parseLegacyDate('2025/9/14')).toBe('2025-09-14');
    expect(parseLegacyDate('2023.02.30')).toBeUndefined();
    expect(parseLegacyDate('')).toBeUndefined();
  });

  it('reads ROC dates from titles and upload timestamps from file names', () => {
    expect(parseRocDate('1130702')).toBe('2024-07-02');
    expect(parseRocDate('1131332')).toBeUndefined();
    expect(rocDateInText('Journal Watch-范芳郡放射師、鄭憲霖職能治師1140812')).toBe('2025-08-12');
    expect(rocDateInText('電話 2737-2181 分機 3751')).toBeUndefined();
    expect(timestampDateInFileName('20230408162719.jpg')).toBe('2023-04-08');
    expect(timestampDateInFileName('20230630120911115_1121292490_1.pdf')).toBe('2023-06-30');
    expect(timestampDateInFileName('a97b0af0-0afe-48e3-9d23-6cd29a9372ac.jpg')).toBeUndefined();
  });
});

describe('legacy links', () => {
  const options = {
    pageRelativeFile: 'news/info/news/150.html',
    resolveLegacy: (location: { path: string }) => (location.path === '/center/events/develop/evt03' ? '/centers/faculty-development#articles' : undefined),
    httpsUpgrades: EMPTY_HTTPS_UPGRADES,
  };

  it('repairs doubled schemes, escaped entities, zero-width spaces and non-ASCII', () => {
    expect(repairHref('http://https://library.tmu.edu.tw/Forms/Form0706/Form0706.aspx')).toBe('https://library.tmu.edu.tw/Forms/Form0706/Form0706.aspx');
    expect(repairHref('http://​https://evergreen-shadow-f72.notion.site/x')).toBe('https://evergreen-shadow-f72.notion.site/x');
    expect(repairHref('https://www.fda.gov.tw/TC/site.aspx?sid=10899&amp;amp;r=1')).toBe('https://www.fda.gov.tw/TC/site.aspx?sid=10899&r=1');
    expect(repairHref('https://sites.google.com/h.tmu.edu.tw/x/首頁')).toBe('https://sites.google.com/h.tmu.edu.tw/x/%E9%A6%96%E9%A0%81');
  });

  it('rewrites old-site links to new paths and keeps unprobed http links as http', () => {
    expect(resolveLegacyHref('../../../center/events/develop/evt03.html', options)).toEqual({
      status: 'internal', href: '/centers/faculty-development#articles', from: '../../../center/events/develop/evt03.html',
    });
    expect(resolveLegacyHref('http://www.tame.org.tw/', options)).toEqual({ status: 'http', href: 'http://www.tame.org.tw/' });
    expect(resolveLegacyHref('http://https://library.tmu.edu.tw/a', options)).toEqual({ status: 'repaired', href: 'https://library.tmu.edu.tw/a', from: 'http://https://library.tmu.edu.tw/a' });
    expect(resolveLegacyHref('javascript:history.back()', options).status).toBe('dropped');
    expect(resolveLegacyHref('../../../nowhere.html', options).status).toBe('dropped');
  });

  it('upgrades http links only when the committed probe says the host serves https', () => {
    const upgrades = { version: 1 as const, hosts: { 'www.edu.tw': { https: true, detail: 'HTTPS HEAD answered 200' } } };
    expect(resolveLegacyHref('http://www.edu.tw/page?x=1', { ...options, httpsUpgrades: upgrades })).toEqual({
      status: 'upgraded', href: 'https://www.edu.tw/page?x=1', from: 'http://www.edu.tw/page?x=1',
    });
    expect(isPrivateHost('10.62.2.202')).toBe(true);
    expect(isPrivateHost('www.edu.tw')).toBe(false);
  });
});

describe('legacy images', () => {
  it('moves inline data images out of the markup and decodes them by digest', () => {
    const html = extractInlineImages('<p><img alt="" src="data:image/png;base64,iVBORw0KGgo="></p>');
    expect(html).toMatch(/src="legacy-inline:[0-9a-f]{64}"/);
    const src = /src="([^"]+)"/.exec(html)?.[1] ?? '';
    expect(inlineImage(src)?.type).toBe('image/png');
    const located = locateImage(src, 'news/info/news/61.html', '/mirror');
    expect(located.status).toBe('data');
    expect(located.status === 'data' ? located.key : '').toMatch(/^data:image\/png;sha256=[0-9a-f]{64}$/);
  });

  it('never fetches: other hosts are external and absent old-site files are missing', () => {
    expect(locateImage('https://lh5.googleusercontent.com/x', 'news/info/news/60.html', '/mirror').status).toBe('external');
    expect(locateImage('../../../UploadFile/ARTICLE/2023/none.jpg', 'news/info/news/1.html', '/nonexistent-mirror')).toEqual({ status: 'missing', key: '/UploadFile/ARTICLE/2023/none.jpg' });
  });
});

describe('legacy article pages', () => {
  it('reads title, date, category code, cover and body from the article template', () => {
    const document = parseHtml(`<!doctype html><html><body>
      <div class="widget widget-posts"><h4 class="post__title">側欄</h4></div>
      <div class="post-item"><div class="post__img"><img src="../../../UploadFile/ARTICLE/2023/1.jpg"></div>
      <div class="post__meta-cat"><a href="../../cate/N002.html                ">招募相關</a></div>
      <span class="post__meta-date">2022.12.17</span>
      <h1 class="post__title mb-30">
        #PGY【2022】112學年  招募
      </h1>
      <div class="post__desc"><p>內文</p></div>
      <div class="post__desc text-center"><a href="javascript:history.back()">回上一頁</a></div></div>
    </body></html>`);
    const article = extractArticle(document);
    expect(article.title).toBe('#PGY【2022】112學年 招募');
    expect(article.date).toBe('2022-12-17');
    expect(article.categoryCode).toBe('N002');
    expect(article.coverSrc).toBe('../../../UploadFile/ARTICLE/2023/1.jpg');
    expect(article.body?.textContent).toBe('內文');
  });

  it('groups duplicate views of one article by id, coded view first', () => {
    const entries = ['news/info/185.html', 'news/info/news/185.html', 'news/info/n007/185.html', 'board/info/board/BOARD02/39.html', 'news/info/BOARD02/39.html']
      .map((file) => {
        const view = classifyLegacyPath(legacyLocationFromMirrorFile(file).path);
        if (view?.kind !== 'post') throw new Error(`not a post: ${file}`);
        return { page: page(file), view };
      });
    const groups = groupPostViews(entries);
    expect(groups.map((group) => [group.postId, group.code, group.pages[0]?.relativeFile, group.pages.length])).toEqual([
      ['39', 'BOARD02', 'board/info/board/BOARD02/39.html', 2],
      ['185', 'N007', 'news/info/n007/185.html', 3],
    ]);
  });

  it('fails when one article id appears under two category codes', () => {
    const entries = ['news/info/n001/7.html', 'news/info/n002/7.html'].map((file) => {
      const view = classifyLegacyPath(legacyLocationFromMirrorFile(file).path);
      if (view?.kind !== 'post') throw new Error('not a post');
      return { page: page(file), view };
    });
    expect(() => groupPostViews(entries)).toThrow(LegacyImportError);
  });
});

describe('legacy classification and redirects', () => {
  const lookups: RedirectLookups = {
    posts: new Map([
      ['185', { channel: 'news', owner: 'department' }],
      ['39', { channel: 'honors', owner: 'department' }],
      ['145', { channel: 'center', owner: 'faculty_dev' }],
      ['93', { channel: 'center', owner: 'digital_materials' }],
    ]),
    albums: new Set(['29']),
    photoAlbums: new Map([['90', '29']]),
    departmentPages: new Map([[29, 'director-message']]),
    organizationPageId: 'organization-chart',
    sections: new Set(['/trainees/joint-training#downloads', '/trainees/residents#albums', '/centers/faculty-development#center-articles']),
  };
  const target = (path: string) => {
    const view = classifyLegacyPath(path);
    if (view === undefined) throw new Error(`unclassified: ${path}`);
    return redirectTarget(view, lookups);
  };

  it('maps every kind of old page to its canonical new route', () => {
    expect(target('/news/info/n007/185')).toBe('/announcements/185');
    expect(target('/board/info/board/BOARD02/39')).toBe('/honors/39');
    expect(target('/center/info/develop/EVT03/145')).toBe('/centers/faculty-development/articles/145');
    expect(target('/center/info/DIGITAL/ABT04/93')).toBe('/digital-materials/articles/93');
    expect(target('/news/cate/N002')).toBe('/announcements?category=recruitment');
    expect(target('/board/cate/board/board04')).toBe('/honors?category=faculty-certification#board');
    expect(target('/about/detail/29')).toBe('/department/director-message');
    expect(target('/about/index')).toBe('/department/organization-chart');
    expect(target('/album/info/album/ELB02/29')).toBe('/gallery/29');
    expect(target('/center/info/CLINICAL/elb02/33')).toBe('/gallery?owner=clinical_skills');
    expect(target('/center/album/ELB02/90')).toBe('/gallery/29');
    expect(target('/student/doctor/stu05/home')).toBe('/trainees/joint-training');
    expect(target('/student/album/stu05/alb04')).toBe('/trainees/joint-training');
    expect(target('/student/album/stu01/alb01')).toBe('/trainees/residents#albums');
    expect(target('/student/comm/stu05/dwn04')).toBe('/trainees/joint-training#downloads');
    expect(target('/student/training/stu01/trn01')).toBe('/trainees/residents');
    expect(target('/center/events/develop/evt03')).toBe('/centers/faculty-development#center-articles');
    expect(target('/center/events/medical/evt01')).toBe('/centers/evidence-based-medicine');
    expect(target('/about/committee')).toBe('/department');
    expect(target('/home/video/stu03/cvd03')).toBe('/videos?owner=faculty_dev');
    expect(target('/home/video/stu04/vdo04')).toBe('/videos?owner=allied-health-trainees');
    expect(target('/contact')).toBe('/#contact');
    expect(target('/other/links/L002')).toBe('/resources#links');
    expect(classifyLegacyPath('/unknown/page')).toBeUndefined();
  });

  it('builds post paths by channel and owner', () => {
    expect(postPath({ id: '1', channel: 'news', owner: 'faculty_dev' })).toBe('/announcements/1');
    expect(postPath({ id: '114', channel: 'center', owner: 'holistic' })).toBe('/centers/holistic-care/articles/114');
  });

  it('resolves query rules before exact paths and rejects conflicting entries', () => {
    const table = new RedirectTableBuilder();
    table.addExact('/Other/DownloadFile.html', '/resources#downloads');
    table.addDownload('/UploadFile/Download/FILE/a.pdf', '/files/legacy/downloads/a.pdf');
    expect(table.resolve('/other/downloadfile', [['fName', '/UploadFile/Download/FILE/a.pdf']])).toBe('/files/legacy/downloads/a.pdf');
    expect(table.resolve('/OTHER/downloadfile/', [['fName', '/other.pdf']])).toBe('/resources#downloads');
    expect(() => table.addExact('/other/downloadfile', '/elsewhere')).toThrow();
    expect(table.table()).toEqual({
      version: 1,
      exact: { '/other/downloadfile': '/resources#downloads' },
      query: [{ path: '/other/downloadfile', key: 'fName', value: '/UploadFile/Download/FILE/a.pdf', to: '/files/legacy/downloads/a.pdf' }],
    });
  });
});

describe('legacy roster', () => {
  it('reads name, extension and email from the old administrative team text', () => {
    expect(readLegacyRoster('教學部副主任　張瓈方(#3755)\n江明憲事務員(#3760) <235025@h.tmu.edu.tw>\n組長暫代\n楊明芳副管理師(#3770) <874035@h.tmu.edu.tw>')).toEqual([
      { name: '張瓈方', ext: '3755' },
      { name: '江明憲', ext: '3760', email: '235025@h.tmu.edu.tw' },
      { name: '楊明芳', ext: '3770', email: '874035@h.tmu.edu.tw' },
    ]);
  });
});
