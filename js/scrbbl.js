(function ($, window, undefined) {
    
    scrbbl = function ( opts ) {

        defaults = {
            ShowCaptions: true,
            EventId: "",
            IncludeJquery: true
        }

        this.opts = $.extend(true, {}, defaults, opts);
        this.init();

    };


    scrbbl.prototype = {

        constructor: scrbbl,

        
        init: function ( ) {

            $('head').append('<link rel="stylesheet" type="text/css" href="styles/scrbbl.css"></link>')

            if (this.opts.IncludeJquery){
                $('body').append('<script  src="js/jquery-1.8.3.min.js"></script>');            
            }      

            /* EVENT LISTENERS ============================================================ */

            $(".SlideShowNext").live('click', function (e) {
                e.preventDefault();
                var SlideShowDiv = $(this).parent();
                var VisibleSlide = SlideShowDiv.find(".SL_SlideShow_Slide").not(".HideSlide");
                var NextSlide = VisibleSlide.nextAll(".HideSlide").first();

                if (NextSlide.length === 0) {
                    NextSlide = SlideShowDiv.find(".SL_SlideShow_Slide:first");
                    scrbbl.prototype.UpdateSlideCurrent(SlideShowDiv, 1);
                }
                else {
                    scrbbl.prototype.UpdateSlideCurrent(SlideShowDiv, parseInt(SlideShowDiv.find(".SL_SlideShow_Current").html(), 10) + 1);
                }
                NextSlide.removeClass("HideSlide");
                VisibleSlide.addClass("HideSlide");
                return false;
            });

            $(".SlideShowPrev").live('click', function (e) {
                e.preventDefault();
                var SlideShowDiv = $(this).parent();
                var VisibleSlide = SlideShowDiv.find(".SL_SlideShow_Slide").not(".HideSlide");
                var PrevSlide = VisibleSlide.prevAll(".HideSlide").first();

                if (PrevSlide.length === 0) {
                    PrevSlide = SlideShowDiv.find(".SL_SlideShow_Slide:last");
                    scrbbl.prototype.UpdateSlideCurrent(SlideShowDiv, SlideShowDiv.find(".SL_SlideShow_Slide").length);
                }
                else {
                    scrbbl.prototype.UpdateSlideCurrent(SlideShowDiv, parseInt(SlideShowDiv.find(".SL_SlideShow_Current").html(), 10) - 1);
                }
                PrevSlide.removeClass("HideSlide");
                VisibleSlide.addClass("HideSlide");
                return false;
            });

            /* ============================================================================ */                 

        },

        Render: function(pPost){

            // Create a div with a class of Content that contains the post content.
            var NewContentDiv = document.createElement("div");
            NewContentDiv.className = "Content";

            // Add any image, video, or audio to the post content div.
            if (pPost.Media !== undefined) {
                NewContentDiv.innerHTML = this.AddMedia(pPost);
            }

            // If the post is a poll, display the poll.
            else if (pPost.Type === "POLL") {
                NewContentDiv.appendChild(this.DisplayPoll(pPost.Entities, false));
            }

            // Add the regular content if the post is not media or a poll.
            else {
                NewContentDiv.innerHTML = pPost.Content;
            }

            var that = this;
            if ($(NewContentDiv).find(".SL_SlideShow").length){
                setTimeout(function() {
                    that.ResizeAllSlideshows(NewContentDiv);    
                }, 500);
            }

            return NewContentDiv;
        },

        RenderAll: function(pPosts){
            var Posts = [];

            for (var i=0 ; i < pPosts.length; i++){
                Posts.push(this.Render(pPosts[i]));
            }
            return Posts;
        },

       //resize all slideshows in a container
        ResizeAllSlideshows: function(container){
            var that = this;
            jQuerySL(container).find('.SL_SlideShow').each(function (i, el) {
                that.ResizeSlideshow(jQuerySL(el));
            });
        },

        UpdateSlideCurrent: function (pSlideShow, pValue) {
            $(pSlideShow).find(".SL_SlideShow_Current").html(pValue);
            $(".FloatingXButton,.FloatingEditButton").remove();
        },

                //the function that resizes a slideshow
        ResizeSlideshow: function (slideshowContainer) {
            var max = 0,
                maxImg = 0,
                maxImgW = 0,
                maxCaption = 0,
                counterHeight = 0;

            if (!$(slideshowContainer).hasClass('SL_SlideShow')) {
                slideshowContainer = $(slideshowContainer).closest('.SL_SlideShow');
                if (!slideshowContainer.length) {
                    return;
                }
            }

            $('.SL_SlideShow_Slide .MediaWrap', slideshowContainer).css('height', 'auto');
            $('.SL_SlideShow_Slide .Media', slideshowContainer).css('height', 'auto');
            $('.SL_SlideShow_Counter', slideshowContainer).css('height', 'auto');

            counterHeight = slideshowContainer.find('.SL_SlideShow_Counter').height();

            //use content div to determine size
            $('.SL_SlideShow_Slide', slideshowContainer).each(function (i, el) {

                var $slide = $(this),
                IsTweet = $slide.find('.sltc-twitter').length > 0;
                $img = IsTweet ? $slide.find('.sltc-twitter') : $slide.find('img'),
                $media = $img.parent('.Media');
                $meta = $slide.find('.Meta'),
                $caption = $slide.find('.Caption');

                //set tweet width to parent
                if (IsTweet && $img.find("img").not(".sltc-avatar img").length == 0) {
                    $img.css('width', $media.width() - ($img.outerWidth() - $img.width()));
                }

                // Determine tallest container dimension
                if ($img.outerHeight() > maxImg) {
                    maxImg = $img.outerHeight();
                }

                // Determine widest container dimension
                if ($img.width() > maxImgW) {
                    maxImgW = $img.width();
                }

                // Determine tallest caption dimensions
                if (($caption.outerHeight() + $meta.outerHeight()) > maxCaption) {
                    maxCaption = ($caption.outerHeight() || 0) + ($meta.outerHeight() || 0);
                }

                if (maxCaption < counterHeight) {
                    maxCaption = counterHeight;
                }


            });

            max = maxImg + maxCaption;

            // Set dimensions of containers
            if (max > 0) {
                $('.SL_SlideShow_Slide .MediaWrap', slideshowContainer).css('height', max);
                $('.SL_SlideShow_Slide .Media', slideshowContainer).css('height', maxImg);
                $('.SL_SlideShow_Slide .MetaWrap', slideshowContainer).css('top', maxImg);
                $('.SL_SlideShow_Counter', slideshowContainer).css('height', max - maxImg);
            }

            $('.SlideShowNav', slideshowContainer).css('top', maxImg / 2);

            $slideContent = $('.SL_SlideShow_Slide .sltc-twitter').add($('.SL_SlideShow_Slide img').not('.sltc-twitter img'));

            // set content dimensions and center within the container
            $($slideContent, slideshowContainer).each(function (i, el) {
                var $img = $(el),
                    $media = $(el).parents('.Media'),
                    diff = ((maxImg - $img.height()) / 2),
                    $width = $img.outerWidth(),
                    $height = $img.outerHeight();

                //special case for twitter text slides
                if ($img.hasClass("sltc-twitter")) {
                    $img.css({
                        'position': 'absolute',
                        'top': '50%',
                        'margin-top': (($height / 2) * -1),
                        'width': $media.width() - ($img.outerWidth() - $img.width())
                    });
                } else if ($height < maxImg && $width < $media.width()) {
                    // center image both horiz. and vert.
                    $img.css({
                        'position': 'absolute',
                        'margin-left': (($width / 2) * -1),
                        'margin-top': (($height / 2) * -1),
                        'left': '50%',
                        'top': '50%'
                    });
                } else if ($height < maxImg) {
                    // center image vertically
                    $img.css({
                        'position': 'absolute',
                        'margin-left': '0',
                        'left': '0',
                        'margin-top': (($height / 2) * -1),
                        'top': '50%'
                    });
                } else if ($width < $media.width()) {
                    // center image horizontally
                    $img.css({
                        'position': 'absolute',
                        'margin-top': '0',
                        'top': '0',
                        'margin-left': (($width / 2) * -1),
                        'left': '50%'
                    });
                } else {
                    // no centering required.
                    $img.css({
                        'position': 'relative',
                        'top': '0',
                        'margin-top': '0',
                        'left': '0',
                        'margin-left': '0'
                    });
                }
            })
        },
    
        // The function that displays a poll both before and after voting.
        DisplayPoll: function (pPostContent, AlreadyVoted) {

            var ThePoll = document.createElement("dl");
            ThePoll.id = "Poll" + pPostContent.Id;

            var TheQuestion = document.createElement("dt");
            TheQuestion.innerHTML = pPostContent.Question;
            ThePoll.appendChild(TheQuestion);

            var PollAnswers = pPostContent.Answers;
            for (var p = 0; p < PollAnswers.length; p++) {
                var PollQuestion = document.createElement("dd");
                PollQuestion.id = "Answer" + PollAnswers[p].Id;
                if (AlreadyVoted === false) {
                    PollQuestion.innerHTML = "<a class='Vote' onclick='scrbbl.prototype.VoteOnPoll(" + pPostContent.Id + "," + PollAnswers[p].Id + ")'><input type='radio' /></a><span>" + PollAnswers[p].Text + "</span>";
                } else if (AlreadyVoted === true) {
                    PollQuestion.innerHTML = PollAnswers[p].Text + " (" + PollAnswers[p].Votes + " votes)";
                }
                ThePoll.appendChild(PollQuestion);
            }

            return ThePoll;
        },

        // The function that is called when a user votes on a poll.
        VoteOnPoll: function (pPollId, pAnswerId) {
            // Figure out if the user has already voted by setting a class and checking for that class before submitting the vote.
            var AlreadyVoted = false;
            var ChosenAnswer = document.getElementById("Answer" + pAnswerId);
            for (var v = 0; v < ChosenAnswer.parentNode.childNodes.length; v++) {
                if (ChosenAnswer.parentNode.childNodes[v].className === "Voting") {
                    AlreadyVoted = true;    
                }
            }
            if (AlreadyVoted === true) {
                return;
            }
            ChosenAnswer.className = "Voting";
            // Add the api call that submits the vote.
            var VotePollAPICall = document.createElement("script");
            VotePollAPICall.type = "text/javascript";
            VotePollAPICall.src = "http://apiv1.scribblelive.com/poll/" + pPollId + "/vote/" + pAnswerId + "?callback=scrbbl.prototype.PollVoteSuccess";
            document.getElementsByTagName("head")[0].appendChild(VotePollAPICall);
        },

        // The function that gets the response after someone votes on a poll, and updates the poll results.
        PollVoteSuccess: function (pPollResponse) {
            // Remove the script used to submit the vote to the api.
            var Scripts = document.getElementsByTagName("head")[0].getElementsByTagName("script");
            for (var i = 0; i < Scripts.length; i++) {
                var ScriptSource = Scripts[i].src;
                if (ScriptSource.match("^\http:\/\/apiv1\.scribblelive\.com/poll/" + pPollResponse.Id + ".*") !== null) {
                    document.getElementsByTagName("head")[0].removeChild(Scripts[i]);
                }
            }
            // Remove the voting elements and display the results.
            var ThePoll = document.getElementById("Poll" + pPollResponse.Id);
            var PollParent = ThePoll.parentNode;
            PollParent.removeChild(ThePoll);
            PollParent.appendChild(this.DisplayPoll(pPollResponse, true));
        },
        
        // The function that adds images, video, and audio to posts containing media that are added or edited.
        AddMedia: function (pPost) {
            var Media = pPost.Media;
            var MediaHtml;
            for (var m = 0; m < Media.length; m++) {
                if ((pPost.Type === "IMAGE" || pPost.Type === "TWEET") && Media[m].Type === "IMAGE") {
                    MediaHtml = "<img src='" + Media[m].Url + "'/>";
                }
                if (pPost.Type === "VIDEO" && Media[m].Type === "VIDEO") {
                    MediaHtml = "<embed type='application/x-shockwave-flash' src='http://embed.scribblelive.com/js/jwflvplayer/player-licensed.swf?ThreadId=" + this.opts.EventId + "' flashvars='file=" + Media[m].Url + "'>";
                }
                if (pPost.Type === "AUDIO" && Media[m].Type === "AUDIO") {
                    MediaHtml = "<embed height='20' width='300' type='application/x-shockwave-flash' src='http://embed.scribblelive.com/js/jwflvplayer/player-licensed.swf?ThreadId=" + this.opts.EventId + "' flashvars='file=" + Media[m].Url + "'>";
                }
            }

            // Add the caption to the media added above.
            var NewContent;
            if ((pPost.Content !== "") && (pPost.Content !== undefined) && (this.opts.ShowCaptions)) {
                var MediaCaption = "<p class='Caption'>" + pPost.Content + "</p>";
                NewContent = MediaHtml + MediaCaption;
            } else {
                NewContent = MediaHtml;
            }

            return NewContent;
        }
    };
} ((typeof jQuerySL !== 'undefined' ? jQuerySL : jQuery), window));