// @ts-ignore
import ShortcodeParser from 'meta-shortcodes';

export function modifyWordpressObject(post: any) {
    if (!post || !post.content) {
        return false;
    }
    const modified = Object.assign({}, post);

    const mediaObj = structureFeaturedMedia(post);
    modified.custom_modified = {
        content: extractShortcode(post.content.rendered),
        galleryImgs: extractImageGalleryShortcode(modified.custom_meta.custom_meta_sc_projects_images),
        tags: structurePostTags(post),
        media: mediaObj,
        imgSrcSet: getImageSrcSet(mediaObj),
        featuredImgSrc: getImageUrl(mediaObj, 'medium_large'),
        postUrlPath: getPostUrlPath(post),
    };

    return modified;
}

function getPostUrlPath(post: any) {
    if (!post) {
        return '';
    }
    return `/${post.type}/${post.slug}/`;
}

function extractShortcode(text: any) {
    if (!text || text === '') {
        return '';
    }

    text = text
        .replace(/\&#8221;/g, '"') // replace special character "
        .replace(/\&#8243;/g, '"')
        .replace(/\&#8217;/g, "'")
        .replace(/\&#8220;/g, '"');

    return text;
}

function extractImageGalleryShortcode(text: any) {
    if (!text || text === '') {
        return '';
    }
    if (text.indexOf('gallery_lightbox') < 0) {
        return '';
    }
    const parser = ShortcodeParser();
    parser.add('img_c', (opts: any, content: any) => {
        return JSON.stringify({
            thumbnailWidth: 320,
            thumbnailHeight: 320,
            alt: opts.alt,
            thumbnail: opts.src,
            src: opts.src,
            caption: opts.title,
            tags: [{ value: opts.title, title: opts.title }],
        });
    });
    parser.add('gallery_lightbox', (opts: any, content: any) => {
        content = JSON.parse(`[${content.replace(/<br ?\/?>/g, '')}]`);
        return JSON.stringify({ title: opts.title, description: opts.description, type: opts.type, images: content });
    });

    const parsedText = parser.parse(text);
    const splitText = parsedText.split('<break/>');
    for (const i in splitText) {
        if (splitText.hasOwnProperty(i)) {
            splitText[i] = JSON.parse(splitText[i]);
        }
    }
    return splitText;
}

function regexUrl(url: string) {
    if (!url || url === '') {
        return '';
    }
    return url.replace(new RegExp('(.*/)[^/]+$'), '$1');
}

function structureFeaturedMedia(post: any) {
    let media: any = {};

    if (post && post._embedded && post._embedded['wp:featuredmedia'] && post._embedded['wp:featuredmedia'][0]) {
        const featuredMedia = post._embedded['wp:featuredmedia'][0];

        media = featuredMedia;
        media.width = featuredMedia.width;
        media.height = featuredMedia.height;

        if (media.media_details && media.media_details.sizes) {
            const mediaDetails = media.media_details;

            media.small = mediaDetails.sizes.small;
            media.medium = mediaDetails.sizes.medium;
            media.mediumwide = mediaDetails.sizes.mediumwide;
            media.medium_large = mediaDetails.sizes.medium_large;
            media['post-thumbnail'] = mediaDetails.sizes['post-thumbnail'];
            media.xlarge = mediaDetails.sizes.xlarge;
            media.wide = mediaDetails.sizes.wide;
            media.thumbnail = mediaDetails.sizes.thumbnail;
            media.large = mediaDetails.sizes.large;
            media.full = mediaDetails.sizes.full;
        }
    }
    return media;
}
function structurePostTags(post: any) {
    const termList: any[] = [];

    if (post && post._embedded && post._embedded['wp:term'] && post._embedded['wp:term']) {
        const taxonomies = post._embedded['wp:term'];
        if (taxonomies.length > 0) {
            taxonomies.map((tax: any) => {
                if (tax.length > 0) {
                    tax.map((term: any) => {
                        if (term.taxonomy !== 'post_tag') {
                            const tempTerm: any = {};
                            tempTerm.id = term.id;
                            tempTerm.name = term.name;
                            tempTerm.slug = term.slug;
                            tempTerm.link = getReplacedUrlLink(term.link);

                            termList.push(tempTerm);
                        }
                    });
                }
            });
        }
    }
    return termList;
}

export function getImageUrl(media: any, type: any) {
    // Default - post-thumbnail
    let img: any = {};
    img.source_url = '';

    if (type && type !== '') {
        if (type === 'thumbnail') {
            img = media.thumbnail;
        }
        if (type === 'small') {
            img = media.small;
        }
        if (type === 'medium') {
            img = media.medium;
        }
        if (type === 'mediumwide') {
            img = media.mediumwide;
        }
        if (type === 'medium_large') {
            img = media.medium_large;
        }
        if (type === 'large') {
            img = media.large;
        }
        if (type === 'full') {
            img = media.full;
        }
        if (type === 'wide') {
            img = media.wide;
        }
        if (type === 'xlarge') {
            img = media.xlarge;
        }
    }
    if (img && img.source_url === '') {
        img = media['post-thumbnail'];
    }
    if (img && img.source_url === '') {
        img = media.thumbnail;
    }
    if (img && img.source_url === '') {
        img = media.small;
    }
    if (img && img.source_url === '') {
        img = media.medium;
    }
    if (img && img.source_url === '') {
        img = media.mediumwide;
    }
    if (img && img.source_url === '') {
        img = media.medium_large;
    }
    if (img && img.source_url === '') {
        img = media.large;
    }
    if (img && img.source_url === '') {
        img = media.full;
    }
    if ((img && img.source_url === '') || !img) {
        img = {};
        img.source_url = media
            ? media.source_url
            : 'https://www.wp.theceomagazine.com/wp-content/uploads/2018/03/Igor-Klimkin_SPLAT-400x246.jpg';
    }
    return img;
}

function getImageSrcSet(media: any) {
    let img = '';

    if (media.thumbnail && media.thumbnail.source_url) {
        img += media.thumbnail.source_url + ' 75w, ';
    }
    if (media.small && media.small.source_url) {
        img += media.small.source_url + ' 150w, ';
    }
    if (media.medium && media.medium.source_url) {
        img += media.medium.source_url + ' 440w, ';
    }
    if (media.mediumwide && media.mediumwide.source_url) {
        img += media.mediumwide.source_url + ' 440w, ';
    }
    if (media.large && media.large.source_url) {
        img += media.large.source_url + ' 640w, ';
    }
    if (media.largewide && media.largewide.source_url) {
        img += media.largewide.source_url + ' 640w, ';
    }
    if (media.xlarge && media.xlarge.source_url) {
        img += media.xlarge.source_url + ' 800w';
    }
    if (media.featured && media.featured.source_url) {
        img += ', ' + media.featured.source_url + ' 800w ';
    }
    if (media.full && media.full.source_url) {
        img += ', ' + media.full.source_url + ' 1200w ';
    }

    return img;
}

function getReplacedUrlLink(url: any) {
    /*if(!url || url === ""){
		return url;
	 }
    let replaceTo = "http://localhost:3000/";
    let replaceFrom = "https://www.theceomagazine.net/";

    if(publicRuntimeConfig && publicRuntimeConfig.node_env ==== "production"){
        replaceTo = "https://www.theceomagazine.com/";
        let replaceFrom = "https://www.theceomagazine.net/";
        return regexUrl(url);
    }
    if(publicRuntimeConfig && publicRuntimeConfig.node_env ==== "development"){
        url = regexUrl(url.replace('https://www.theceomagazine.com/', replaceTo));
    }
    url = regexUrl(url.replace('https://cms.theceomagazine.net/', replaceTo));
    return regexUrl(url.replace(replaceFrom, replaceTo));*/
    return url;
}

type FilterProjectsByCareerIdProps = {
    career_id: string;
    list: any[];
};
export function filterProjectsByCareerId({ career_id, list }: FilterProjectsByCareerIdProps): any[] {
    if (!list.map) {
        return [];
    }

    return list.filter((obj: any) => {
        if (obj && obj.custom_meta && obj.custom_meta.custom_meta_company_id) {
            if (career_id === obj.custom_meta.custom_meta_company_id) {
                return obj;
            }
        }
    });
}

type FilterPerPageProps = {
    per_page: number;
    list: any[];
};
export function filterPerPage({ per_page, list }: FilterPerPageProps): any[] {
    if (!list.map) {
        return [];
    }
    if (list.length <= per_page) {
        return list;
    }

    let counter = 0;
    return list.filter((obj: any) => {
        if (counter++ < per_page) {
            return obj;
        }
    });
}

type FilterBySlugProps = {
    slug: string;
    list: any[];
};
export function filterBySlug({ slug, list }: FilterBySlugProps): any[] {
    if (!list.map) {
        return [];
    }

    return list.filter((obj: any) => {
        if (slug === obj.slug) {
            return obj;
        }
    });
}
