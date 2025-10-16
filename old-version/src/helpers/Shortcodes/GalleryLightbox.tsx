import * as React from 'react';
// @ts-ignore
import Lightbox from 'react-images';
// @ts-ignore
import Gallery from 'react-photo-gallery';

class GalleryLightbox extends React.PureComponent {
    public state: {
        currentImage: number;
        lightboxIsOpen: boolean;
    };
    constructor(props: any) {
        super(props);

        this.state = { currentImage: 0, lightboxIsOpen: false };
        this.closeLightbox = this.closeLightbox.bind(this);
        this.openLightbox = this.openLightbox.bind(this);
        this.gotoNext = this.gotoNext.bind(this);
        this.gotoPrevious = this.gotoPrevious.bind(this);
    }

    public openLightbox(event: any, obj: any) {
        this.setState({
            currentImage: obj.index,
            lightboxIsOpen: true,
        });
    }
    public closeLightbox() {
        this.setState({
            currentImage: 0,
            lightboxIsOpen: false,
        });
    }
    public gotoPrevious() {
        this.setState({
            currentImage: this.state.currentImage - 1,
        });
    }
    public gotoNext() {
        this.setState({
            currentImage: this.state.currentImage + 1,
        });
    }

    public render() {
        const photos = [
            { src: 'https://images.unsplash.com/photo-1470619549108-b85c56fe5be8?w=1024&h=1024', width: 4, height: 3 },
            { src: 'https://images.unsplash.com/photo-1471079502516-250c19af6928?w=1024&h=1024', width: 4, height: 3 },
            { src: 'https://images.unsplash.com/photo-1454023492550-5696f8ff10e1?w=1024&h=1024', width: 4, height: 3 },
            { src: 'https://images.unsplash.com/photo-1470854989922-5be2f7456d78?w=1024&h=1024', width: 4, height: 3 },
        ];

        return (
            <div className="header-wrapper">
                <Gallery photos={photos} onClick={this.openLightbox} />
                <Lightbox
                    images={photos}
                    onClose={this.closeLightbox}
                    onClickPrev={this.gotoPrevious}
                    onClickNext={this.gotoNext}
                    currentImage={this.state.currentImage}
                    isOpen={this.state.lightboxIsOpen}
                />
            </div>
        );
    }
}

export default GalleryLightbox;
