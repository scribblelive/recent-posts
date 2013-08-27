
(function(){

    var $S = SCRIBBLE;

    $S.namespace( 'ui' );

    /**
     *  SCRIBBLE.ui.SlideShow
     *  @description Creates an image slideshow with user-controlled links for
     *  navigating between slides (next/prev).
     */
    $S.ui.SlideShow = ( function( jQuerySL ){        
        var configured = false;
        var slideshowHTML;
        var slideTmpl;
        var reorderTmpl;
        var $ = jQuerySL;

        return{

            // public methods

            /**
             *  @method Configure
             *  @description Sets up the initial configuration for the Slideshow, including
             *  template setup and event listeners.
             *  @param (Boolean) setupTemplates Indicates whether to set up templates during
             *  configuration
             */            
            Configure: function ( setupTemplates ){
                var _self      = this,
                    SlideShows = $(".SL_SlideShow"),
                    slideshowTmplSource,
                    slideshowTmpl,
                    slideTmplSource,
                    reorderTmplSource,
                    i, j;

                if ( setupTemplates === true ){

                    if ( typeof Handlebars !== 'undefined' && !slideTmpl ){

                        // Register custom helper method with Handlebars
                        Handlebars.registerHelper( 'reorder_images', function( items, options ){
                            var output = '';
                            var item;

                            for( i = 0, j = items.length; i < j; i++ ){
                                item = items[ i ];
                                item.width = 100;
                                item.height = 100;
                                output += options.fn( item );
                            }

                            return output;    
                        } );                    

                        // template setup
                        slideshowTmplSource = $.trim( $("#slideshow-container-tmpl").html() );
                        slideshowTmpl = Handlebars.compile( slideshowTmplSource );

                        slideTmplSource = $.trim( $( '#slideshow-slide-tmpl' ).html() );
                        slideTmpl = Handlebars.compile( slideTmplSource );

                        reorderTmplSource = $.trim( $( '#slideshow-reorder-tmpl' ).html() );
                        reorderTmpl = Handlebars.compile( reorderTmplSource );

                        slideshowHTML = slideshowTmpl( { current: 1, total: 1 } );
                    }

                }


                if ( configured === false ){

                    // Prevent user-selection of the slideshow slides when clicking/double-clicking
                    // on any area (other than the caption).  This is a workaround, as the "user-select"
                    // CSS property doesn't seem to be triggering this functionality.
                    $( '.SL_SlideShow' ).live( 'mousedown', function( e ){
                        var MouseTarget = $( e.target );
                        if ( !MouseTarget.is( 'div.SlideShowNext, div.SlideShowPrev' ) && MouseTarget.closest( '.Caption' ).length < 1 ){
                            e.preventDefault();
                            return false;
                        }
                    } );

                    // Attach event handlers for previous/next links
                    $( ".SlideShowNext" ).live( 'click', function ( e ) {
                        e.preventDefault();
                        var SlideShowDiv = $(this).parent();
                        var VisibleSlide = SlideShowDiv.find(".SL_SlideShow_Slide").not(".HideSlide");
                        var NextSlide = VisibleSlide.nextAll(".HideSlide").first();

                        if ( NextSlide.length === 0 )
                        {
                            NextSlide = SlideShowDiv.find(".SL_SlideShow_Slide:first");
                            _self.UpdateSlideCurrent( SlideShowDiv, 1 );
                        }
                        else
                        {
                            _self.UpdateSlideCurrent ( SlideShowDiv,  parseInt( SlideShowDiv.find( ".SL_SlideShow_Current" ).html(), 10 ) + 1 );
                        }
                        NextSlide.removeClass("HideSlide");
                        VisibleSlide.addClass("HideSlide");
                        return false;
                    });

                    $( ".SlideShowPrev" ).live( 'click', function ( e ) {                                
                        e.preventDefault();
                        var SlideShowDiv = $(this).parent();
                        var VisibleSlide = SlideShowDiv.find(".SL_SlideShow_Slide").not(".HideSlide");
                        var PrevSlide = VisibleSlide.prevAll(".HideSlide").first();

                        if ( PrevSlide.length === 0 )
                        {
                            PrevSlide = SlideShowDiv.find(".SL_SlideShow_Slide:last");
                            _self.UpdateSlideCurrent( SlideShowDiv, SlideShowDiv.find( ".SL_SlideShow_Slide" ).length );
                        }
                        else
                        {
                            _self.UpdateSlideCurrent ( SlideShowDiv,  parseInt( SlideShowDiv.find( ".SL_SlideShow_Current" ).html(), 10 ) - 1 );
                        }
                        PrevSlide.removeClass("HideSlide");
                        VisibleSlide.addClass("HideSlide");
                        return false;
                    });

                    // Reload and resize existing slideshows on the page.
                    SlideShows = $(".SL_SlideShow");
                    SlideShows.each(function (pIndex, pElement){ 
                        var SlideShowDiv = $( pElement );
                        var images = SlideShowDiv.find( '.Media > img' );

                        images.addClass( 'loading' );
                        _self.PreloadImages( SlideShowDiv.find("img"), function (){
                           _self.Resize( SlideShowDiv );
                            images.removeClass( 'loading' );
                        });     
                    });       

                    configured = true;                        
                }

            },       

            /**
             *  @method Create
             *  @description Creates the initial slideshows and adds the first media item
             *  @param (Image) pMediaElement Media element to set up a Slideshow for
             */            
            Create: function ( pMediaElement )
            {
                var slideshowDOM = $( slideshowHTML ).clone(),
                    initialSlide;

                pMediaElement.removeAttr( "style" );
                pMediaElement.addClass( "SL_SlideShow_Slide" );
                pMediaElement.removeClass ( "SL_Top SL_Left SL_Right" );

                slideshowDOM.insertBefore( pMediaElement );
                initialSlide = this.AddSlide( pMediaElement, false, slideshowDOM );

                return initialSlide;
            },

            /**
             *  @method Resize
             *  @description Resizes the slideshow items to fit all images and caption dimensions.
             *  @param {Element} slideshowContainer The Slideshow element to resize
             */            
            Resize: function( slideshowContainer ){
                var max           = 0,
                    maxImg        = 0,
                    maxImgW       = 0,
                    maxCaption    = 0,
                    counterHeight = 0;

                if ( ! $( slideshowContainer ).hasClass( 'SL_SlideShow') ){
                    slideshowContainer = $( slideshowContainer ).closest( '.SL_SlideShow' );
                    if ( ! slideshowContainer.length ){
                        return;
                    }
                }

                $( '.SL_SlideShow_Slide .MediaWrap', slideshowContainer ).css( 'height', 'auto' );
                $( '.SL_SlideShow_Slide .Media', slideshowContainer ).css( 'height','auto' );
                $( '.SL_SlideShow_Counter', slideshowContainer ).css( 'height', 'auto' );

                counterHeight = slideshowContainer.find( '.SL_SlideShow_Counter' ).height();

                $( '.SL_SlideShow_Slide', slideshowContainer ).each( function( i, el ){
                    var $media   = $( this ).find( '.MediaWrap'),
                        $img     = $( this ).find( 'img' ),
                        $caption = $( this ).find( '.Caption' ),
                        $meta    = $( this ).find( '.Meta' );

                    // Determine tallest image dimensions
                    if ( $img.height() > maxImg ){
                        maxImg = $img.height();
                    }

                    // Determine widest image dimensions
                    if ( $img.width() > maxImgW ){
                        maxImgW = $img.width();
                    }

                    // Determine tallest caption dimensions
                    if ( ( $caption.outerHeight() + $meta.outerHeight() ) > maxCaption ){
                        maxCaption = ( $caption.outerHeight() || 0 ) + ( $meta.outerHeight() || 0 );
                    }

                    if ( maxCaption < counterHeight ){
                        maxCaption = counterHeight;
                    }

                    max = maxImg + maxCaption;
                } );

                max = maxImg + maxCaption;

                // Set dimensions of containers
                if ( max > 0 ){
                    $( '.SL_SlideShow_Slide .MediaWrap', slideshowContainer ).css( 'height', max );
                    $( '.SL_SlideShow_Slide .Media', slideshowContainer ).css( 'height', maxImg );
                    $( '.SL_SlideShow_Slide .MetaWrap', slideshowContainer ).css( 'top', maxImg );
                    $( '.SL_SlideShow_Counter', slideshowContainer ).css( 'height', max - maxImg );
                }

                $( '.SlideShowNav', slideshowContainer ).css( 'top', maxImg / 2 );

                // set image dimensions and center within the container
                $( '.SL_SlideShow_Slide img', slideshowContainer ).each(function( i, el ){
                    var $img   = $( el ),
                        $media = $( el ).parents( '.Media' ),
                        diff   = ( ( maxImg - $img.height() ) / 2 );

                    if ( $img.height() < maxImg && $img.width() < $media.width() ){
                        // center image both horiz. and vert.
                        $img.css( 'position', 'absolute' );
                        $img.css( 'margin-left', ( ( $img.width() / 2 ) * -1 ) );
                        $img.css( 'margin-top', ( ( $img.height() / 2 ) * -1 ) );
                        $img.css( 'left', '50%' );
                        $img.css( 'top', '50%' );
                    } else if ( $img.height() < maxImg ){
                        // center image vertically
                        $img.css( 'position', 'absolute' );
                        $img.css( 'margin-left', 0 );
                        $img.css( 'left', 0 );
                        $img.css( 'margin-top', ( ( $img.height() / 2 ) * -1 ) );
                        $img.css( 'top', '50%' );
                    } else if ( $img.width() < $media.width() ){
                        // center image horizontally
                        $img.css( 'position', 'absolute' );
                        $img.css( 'margin-top', 0 );
                        $img.css( 'top', 0 );
                        $img.css( 'margin-left', ( ( $img.width() / 2 ) * -1 ) );
                        $img.css( 'left', '50%' );
                    } else {
                        // no centering required.
                        $img.css( 'position', 'relative' );
                        $img.css( 'top', 0 );
                        $img.css( 'margin-top', 0 );
                        $img.css( 'left', 0 );
                        $img.css( 'margin-left', 0 );
                    }
                });                
            },                        

            /**
             *  @method ResizeAll
             *  @description Finds all Slideshows on the current page and resizes them.
             */            
            ResizeAll: function( container ){
                var _self = this;
                jQuerySL( ((container != undefined) ? container : '') + ' .SL_SlideShow' ).each( function( i, el ){
                    _self.Resize( jQuerySL( el ) );
                });
            },

            /**
             *  @method PreloadImages
             *  @description Preloads supplied images and calls the supplied callback 
             *  once the images have finished loading.
             *  @param {Array} pImages List of images elements to preload
             *  @param {Function} pCallback Callback function to call once images have
             *  finished loading.
             */            
            PreloadImages: function ( pImages, pCallback )
            {
                var ImageSrcs = [],
                    i, j;

                for( i = 0, j = pImages.length; i < j; i++ ){
                    ImageSrcs.push( pImages[i].src );
                }

                $.imgpreload( ImageSrcs, { all: pCallback } );
            },

            /**
             *  @method EnableFirstSlide
             *  @description Sets the first slide in the slide show as the currently visible slide
             *  @param {Element} slideshowContainer The Slideshow element to work with
             */            
            EnableFirstSlide: function ( pSlideShow )
            {
                var SlideShowDiv = $(pSlideShow),
                    VisibleSlide = SlideShowDiv.find(".SL_SlideShow_Slide").not(".HideSlide"),
                    FirstSlide   = SlideShowDiv.find( ".SL_SlideShow_Slide:first" );

                if ( LiveArticle.GetElementClassIdentifier( VisibleSlide ) !== LiveArticle.GetElementClassIdentifier( FirstSlide ) )
                {
                    FirstSlide.removeClass( "HideSlide" );
                    VisibleSlide.addClass( "HideSlide" );
                    this.UpdateSlideCurrent( SlideShowDiv, 1 );
                }
            },

            /**
             *  @method ReorderSlides
             *  @description Sets the first slide in the slide show as the currently visible slide
             *  @param {Element} slideshowContainer The Slideshow element to work with
             *  @param {Element} pTargetElement The active Live Article container which the Slideshow
             *  is currently inserted into
             */            
            ReorderSlides: function ( pSlideShow, pTargetElement )
            {
                var _self              = this,
                    SlideShowDiv       = $( pSlideShow ),
                    SlideShowContainer = SlideShowDiv.find( '.SlideContainer' ),
                    Slides             = $( SlideShowDiv.find(".SL_SlideShow_Slide img").clone() ),
                    $reorderHTML       = $( reorderTmpl( { images: Slides } ) ),
                    top                = this.CalculateHeight( pSlideShow, pTargetElement ),
                    Reorder,
                    SaveButton,
                    CancelButton;

                $reorderHTML.insertBefore( pTargetElement )
                            .css( "top", top )
                            .css( "left", SlideShowDiv.position().left )
                            .css( "width", SlideShowDiv.width() )
                            .css( "height", SlideShowDiv.height() );

                Reorder =  $( '.SlideShowReorder', $reorderHTML )
                                    .css( "width", SlideShowDiv.width() )
                                    .css( "height", SlideShowDiv.height() - 40);

                SaveButton = $( '.ReorderSaveButton', $reorderHTML ).click( function( e ) { 
                    e.preventDefault();

                    var ReorderedImages = Reorder.find("img"),
                        CurrentSlide,
                        PreviousSlide,
                        i, j;

                    for ( i = 0, j = ReorderedImages.length; i < j; i++ )
                    {
                        var CurrentImage = ReorderedImages[i].src,
                            ClassName =  LiveArticle.GetElementClassIdentifier( ReorderedImages[i] );

                        if ( ! PreviousSlide )
                        {
                            CurrentSlide = SlideShowContainer.find("." + ClassName ).first().parents( '.SL_SlideShow_Slide' );
                            SlideShowContainer.prepend(CurrentSlide);
                            PreviousSlide = CurrentSlide;
                        }
                        else
                        {
                            CurrentSlide = SlideShowContainer.find("." + ClassName ).first().parents( '.SL_SlideShow_Slide' );
                            CurrentSlide.insertAfter(PreviousSlide);
                            PreviousSlide = CurrentSlide;
                        }
                    }

                    _self.EnableFirstSlide( SlideShowDiv );
                    _self.UpdateSlideCurrent( SlideShowDiv, 1 );

                    $reorderHTML.remove();
                    return false;
                } );

                CancelButton = $( '.ReorderCancelButton', $reorderHTML ).click( function( e ) { 
                    e.preventDefault();
                    $reorderHTML.remove();
                    return false;
                } );

                $(".SlideShowReorder").sortable({ placeholder: "SlideShowReorderHelper", forcePlaceholderSize: true, forceHelperSize: true });
                $(".SlideShowReorder").disableSelection();
                $(".SlideShowReorder").draggable(
                {
                    connectToSortable: ".SlideShowReorder",
                    revert: "invalid",
                    cancel: ".SlideShowReorder"
                });                    
            },

            /**
             *  @method CenterSlides
             *  @deprecated
             */            
            CenterSlides: function ( pSlideShow )
            {
                this.Resize.apply( this, arguments );
            },

            /**
             *  @method CenterSlide
             *  @deprecated
             */            
            CenterSlide: function ( pSlideShow, pSlide )
            {
                this.Resize.apply( this, arguments );
            },

            /**
             *  @method Destroy
             *  @description Destroys the Slideshow instance and restors the remaining
             *  image back to a Media element.
             */            
            Destroy: function ( pSlideShow )
            {
                var SlideShowDiv = $( pSlideShow ),
                    MediaDiv,
                    MetaDiv;

                SlideShowDiv.find(".SlideShowNext").remove();
                SlideShowDiv.find(".SlideShowPrev").remove();
                SlideShowDiv.find(".SL_SlideShow_Counter").remove();
                SlideShowDiv.children().find( '.Media' ).addClass("SL_Top");

                MediaDiv = SlideShowDiv.children().find( '.MediaWrap' ).children();
                MetaDiv =  MediaDiv.find( '.MetaWrap' ).children();

                MediaDiv.find('.MetaWrap').remove();
                MediaDiv.append( MetaDiv );

                MediaDiv.removeAttr('style');
                MediaDiv.find('img').removeAttr('style');

                SlideShowDiv.replaceWith( MediaDiv );
            },

            /**
             *  @method AddSlide
             *  @description Adds the supplied Media element as a sibling to the supplied pSlide.
             *  @param {Element} pContent The Media element to add to the slide show.
             *  @param {Element} pSlide The existing slide to which we can add the pContent as a sibling.
             */            
            AddSlide: function ( pContent, pSlide, slideshow )
            {
                var _self = this,
                    Post  = $( pContent );

                // get elements from pContent
                var img       = Post.find( 'img' ),
                    credit    = Post.find( '.Meta' ),
                    caption   = Post.find( '.Caption' ),
                    metaBy    = credit.find( 'span' ).first(),
                    metaTime  = credit.find( 'span' ).last(),
                    metaName  = credit.find( 'em' ).first(),
                    slideData = {
                        src: img.attr( 'src' ) || '#', 
                        metaby: metaBy.html(),
                        metatime: metaTime.html(),
                        metaname: metaName.html()
                    },
                    $slide,
                    strippedCaptionString = caption.html().replace(/(<[^>]*>|\s|&nbsp;|<%= HttpUtility.JavaScriptStringEncode( Resources.Thread.Add_Caption ) %>)/g, "" );

                if ( caption.length ){
                    if( strippedCaptionString != "" ) {
                        slideData.caption = caption.first().html();
                    }
                }

                // generate slide from template
                $slide = $( slideTmpl( slideData ) );

                if ( ! caption || strippedCaptionString === "" ){
                    $slide.find( '.Caption' ).remove();
                }

                $slide.find( 'img' ).bind( 'load', function(){
                    _self.Resize( $slide.parents( '.SL_SlideShow' ) );
                    Post.remove();
                });

                if ( ! pSlide.jquery && pSlide === false ){
                    slideshow.find( '.SlideContainer' ).append( $slide );
                } else {
                    $slide.addClass( 'HideSlide' );
                    $slide.insertAfter( pSlide );
                }

                this.UpdateSlideTotal( $slide.parents( '.SL_SlideShow' ) );

                return $slide;
            },

            /**
             *  @method UpdateSlideTotal
             *  @description Updates the slideshow counter to the total number of slides
             *  @param {Element} pSlideShow The Slideshow element to work with
             */            
            UpdateSlideTotal: function ( pSlideShow )
            {
                $( pSlideShow ).find( ".SL_SlideShow_Total" ).html( $( pSlideShow ).find( ".SL_SlideShow_Slide" ).length );
                $( ".FloatingXButton,.FloatingEditButton" ).remove();
            },

            /**
             *  @method UpdateSlideCurrent
             *  @description Updates the slideshow counter to the position of the current visible slide
             *  @param {Element} pSlideShow The Slideshow element to work with
             *  @param {Number} pValue The current slide position
             */            
            UpdateSlideCurrent: function ( pSlideShow, pValue )
            {
                $( pSlideShow ).find(".SL_SlideShow_Current").html( pValue );
                $( ".FloatingXButton,.FloatingEditButton" ).remove();
            },

            ResizeSlide: function () {},

            /**
             *  @method RemovedSlide
             *  @description Updates the slideshow's elements to reflect the removal of a slide
             *  @param {Element} pSlideShow The Slideshow element to work with
             */            
            RemovedSlide: function ( pSlideShow )
            {
                var SlideShowDiv = $( pSlideShow );

                SlideShowDiv.find(".SL_SlideShow_Slide:first").removeClass( "HideSlide" );

                this.UpdateSlideTotal( SlideShowDiv );
                this.UpdateSlideCurrent( SlideShowDiv, 1 );

                if ( SlideShowDiv.find( ".SL_SlideShow_Slide" ).length <= 1 )
                {
                    this.Destroy ( SlideShowDiv );
                }
                else
                {
                    this.Resize( SlideShowDiv );
                }
            },

            /**
             *  @method DisplayLoading
             *  @description Displays a loading indicator over top the supplied Slideshow element
             *  @param {Element} pSlideShow The Slideshow element to work with
             *  @param {Element} pTargetElement The active Live Article container which the Slideshow
             *  is currently inserted into
             */            
            DisplayLoading: function ( pElement, pTargetElement )
            {
                var SlideShowDiv = $( pElement ),
                    top          = this.CalculateHeight( pElement, pTargetElement );

                if ( !SlideShowDiv.hasClass( "SL_SlideShow" ) )
                {
                    SlideShowDiv = SlideShowDiv.parent();
                }

                var SlideShowLoading = $( "<div class=\"SlideShowLoading\"></div>" )
                    .insertBefore( pTargetElement )
                    .css( "top", top)
                    .css( "left", SlideShowDiv.position().left )
                    .css( "width", SlideShowDiv.width() )
                    .css( "height", SlideShowDiv.height() );

                setTimeout( function()
                {  
                    SlideShowLoading.remove(); 
                }, 1500 );                
            },

            /**
             *  @method DisplayHotSpot
             *  @description Displays the "drop" target for dragging and dropping a Media element
             *  in order to add a slide to the supplied Slideshow element.
             *  @param {Element} pElement The Slideshow element to work with
             *  @param {Element} pTargetElement The active Live Article container which the Slideshow
             *  is currently inserted into
             *  @param {Function} pDropCallback Callback function to call when a Media element has been
             *  dropped onto a slideshow.
             */            
            DisplayHotSpot: function ( pElement, pTargetElement, pDropCallback )
            {
                var HotSpotText = "<%= Resources.Thread.Slideshow_Create %>",
                    top         = this.CalculateHeight( pElement, pTargetElement ),
                    Height      = pElement.outerHeight() + 20;
                
                pElement = pElement.closest( '.SL_SlideShow' ).length ? pElement.closest( '.SL_SlideShow' ) : pElement;

                if ( pElement.hasClass( "SL_SlideShow" ) ){
                    Height = pElement.outerHeight();
                    HotSpotText = "<%= Resources.Thread.Slideshow_Add_Image %>";
                }

                this.RemoveHotSpot();                
                
                var SlideShowHotSpot = $( '<div class="SlideShowHotSpot">' + HotSpotText + '</div>' )
                    .bind( "mouseover", function(e) { pElement.data( "over", 1 ); } )
                    .bind( "mouseout", function(e) { setTimeout( function() { pElement.data( "over", null ); SlideShow.RemoveHotSpot( pElement ); }, 5 ); } ) 
                    .data( "refblockquote", pElement.get(0) )
                    .insertBefore( pTargetElement )
                    .css( "top", top )
                    .css( "left", pElement.position().left )
                    .css( "width", pElement.outerWidth() )
                    .css( "height", Height * 0.5 )
                    .css( "padding-top", Height * 0.5 );

                pElement.find("img").droppable({ 
                    tolerance: "pointer", 
                    greedy: true,
                    drop: pDropCallback
                });
            },

            /**
             *  @method RemoveHotSpot
             *  @description Removes the "drop" target for the supplied Slideshow element.
             *  @param {Element} pElement The Slideshow element to work with
             */            
            RemoveHotSpot: function ( pElement )
            {
                var SlideShowHotSpot = $( ".SlideShowHotSpot" );

                if ( SlideShowHotSpot.length > 0 && ( ( pElement !== undefined && pElement.data("over") !== 1 ) || pElement === undefined ) )
                {
                    SlideShowHotSpot.remove();
                    if ( pElement !== undefined )
                    {
                        pElement.children("img").droppable("destroy");
                    }
                }

                if ( ! pElement ){
                    SlideShowHotSpot.remove();
                }
            },

            /**
             *  @method IsHotSpotReady
             *  @description Determines whether a Slideshow "drop" target has been set up.
             *  @return {Boolean} Whether or not the drop target has been set up.
             */            
            IsHotSpotReady: function()
            {
                var SlideShowHotSpot = $( ".SlideShowHotSpot" );

                if ( SlideShowHotSpot.length > 0 )
                {
                    return true;
                }
                else
                {
                    return false;
                }
            },

            /**
             *  @method GetHeight
             *  @deprecated
             */            
            GetHeight: function ( pElement )
            {
                var SlideShowDiv = $( pElement );
                var Height = SlideShowDiv.attrSL("class").match(/SLH_(\d+)/);
                if ( Height === null )
                {
                    return 0;
                }
                else
                {
                    return Height[1];
                }
            },

            /**
             *  @method SetHeight
             *  @deprecated
             */            
            SetHeight: function ( pElement, pHeight, pForce )
            {
                this.Resize.apply( this, arguments );
            },

            /**
             *  @method MaxHeight
             *  @deprecated
             */            
            MaxHeight: function ( pSlideShow, pUseStoredHeight )
            {
                return;
            },

            /**
             *  @method SetMaxHeight
             *  @deprecated
             */            
            SetMaxHeight: function ( pSlideShow )
            {
                this.Resize.apply( this, arguments );
            },

            CalculateHeight: function( pElement, pTargetElement )
            {

                var $closestRelativeParent = pTargetElement.parents().filter( function() { 
                    // reduce to only relative position or "body" elements
                    var $this = $( this );
                    return $this.is( 'body' ) || $this.css( 'position' ) === 'relative' || $this.hasClass('FloatingEdit') ;
                } ).slice( 0, 1 ); // grab only the "first"

                return ( pElement.offset().top - $closestRelativeParent.offset().top );
            },

            CleanUp: function( pSlideShow ){

                pSlideShow = pSlideShow.closest( '.SL_SlideShow' );

                if ( ! pSlideShow.hasClass( 'SL_SlideShow' ) ){
                    return;
                }

                pSlideShow.find( "span" ).each( function( i, el )
                {
                    var s = $( this );

                    if ( $.trim( s.contents().text() ) === "" ){
                        s.remove();
                    }
					
			 
                
                } );
            }
        };
    }( jQuerySL ) );

}());


