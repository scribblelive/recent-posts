/*

Title: ScribbleLive Most Recent Posts Script
Description: This script adds the most recent posts in your ScribbleLive event to a web page via the ScribbleLive API. It then checks for updates (new posts, edits, deletes) every 10 seconds and updates the most recent posts accordingly.

*/

function RecentPosts(Options) {

    this.Options = {
        // You can find your API tokens - and generate new ones - under the general API section of your ScribbleLive back end. https://client.scribblelive.com/client/API.aspx
        APIToken: "",
        // You can find your event id under the API section of your event in the ScribbleLive back end. You can also view source on your event and search for "ThreadId".
        EventId: "",
        // The number of posts you would like to display.
        TotalPostsToShow: 10,
        // The id of the element on your page where you would like to display the posts.
        WhereToAddPosts: "",
        // Show images, true or false.
        ShowImages: true,
        // Show videos, true or false.
        ShowVideos: true,
        // Show audio, true or false.
        ShowAudio: true,
        // Show stuck posts, true or false.
        ShowStuckPosts: true,
        //Show avatars, true or false.
        ShowAvatars: true,
        // Show text posts, true or false.
        ShowTextPosts: true,
        // Show polls, true or false.
        ShowPolls: true,
        // Show meta data, true or false.
        ShowMetaData: true,
        // Show media captions, true or false.
        ShowCaptions: true,
        // Show comments, true or false.
        ShowComments: true,
        // Show official (writer, editor, moderator, administrator, guest writer, etc.) posts, true or false.
        ShowOfficialPosts: true,
        // Show Twitter posts, true or false.
        ShowTweets: true,
        // Show mobile posts, true of false.
        ShowMobilePosts: true,
        // Show Facebook posts, true or false.
        ShowFacebookPosts: true,
        // Show only Twitter posts, true or false.
        ShowOnlyTweets: false,
        // Show only Facebook posts, true or false.
        ShowOnlyFacebookPosts: false,
        // Show only polls, true or false.
        ShowOnlyPolls: false
    };

    // Set the option values to the values passed in to the function.
    for (var opt in Options) {
        if (Options.hasOwnProperty(opt)) {
        	this.Options[opt] = Options[opt];
        }
    }

    // Set the last modified time variable.
    this.LastModifiedTime = "";

    // Set an index to keep track of multiple events using this script.
    this.InstanceIndex = RecentPosts.StoreInstance(this);

    var that = this,
        tries = 0,
        S;

    var interval = setInterval( function() {

        if( typeof scrbbl !== 'undefined' ) {

            RecentPosts.__S = new scrbbl( { "ShowCaptions": that.Options.ShowCaptions , "EventId" : that.Options.EventId, "IncludeJquery" : false });
            // Call the function that creates the element that the posts will be added to.
            that.CreatePostList();

            // Call the function that loads the most recent posts.
            that.GetAllPosts();

            clearInterval( interval );
        }
        if (++tries >=10){
            clearInterval( interval );
        }

    }, 200 );

    $('body').append('<script type="text/javascript" src="//embed.scribblelive.com/modules/sdk/scrbbl.js">');
    (function( w, d, eid ){
          var id = 'sl-libjs', where = d.getElementsByTagName( 'script' )[0];

          if ( d.getElementById( id ) ){ return; }

          w._slq = w._slq || [];
          _slq.push( ['_setEventId', eid] );

          js = d.createElement( 'script' );
          js.id = id;
          js.async = true;
          js.src = 'http://embed.scribblelive.com/modules/lib/addons.js';
          where.parentNode.insertBefore( js, where );
     }( window, document,this.Options.EventId ) ); 
}

// Set the index.
RecentPosts.Index = 0;

// The function that decides which instance of the recent posts object is currently being used.
RecentPosts.GetInstance = function (pIndex) {
    if (RecentPosts.__instances === undefined) {
        return undefined;
    }
    else {
        return RecentPosts.__instances["" + pIndex];
    }
};

// The function that sets the instance of the recent posts object.
RecentPosts.StoreInstance = function (pRecentPostsInstance) {
    if (RecentPosts.__instances === undefined) {
        RecentPosts.__instances = [];
    }
    
    var _Index = RecentPosts.Index;
    RecentPosts.Index++;

    RecentPosts.__instances[_Index] = pRecentPostsInstance;

    return _Index;
};

// The function that decides what to do with the response it gets back from the api.
RecentPosts.prototype.DrawPosts = function (pResponse) {
	var CurrentPostsList = this.GetPostList();

    // Add any new posts.
    if (pResponse.Posts !== undefined) {
        for (var p = 0; p < pResponse.Posts.length; p++) {
            this.AddPost(pResponse.Posts[p], CurrentPostsList);
        }
    }

    // If there are deleted posts, check if they are on the page, and deleted them if they are.
    if (pResponse.Deletes !== undefined) {
        for (var d = 0; d < pResponse.Deletes.length; d++) {
            for (var a = 0; a < CurrentPostsList.length; a++) {
                if (pResponse.Deletes[d].Id === parseInt(CurrentPostsList[a])) {
                    this.DeletePost(pResponse.Deletes[d].Id);
                }
            }
        }
    }

    // If there are edited posts, edit them if they are on the page (compare ids) and haven't already been edited (compare last modified times).
    if (pResponse.Edits !== undefined) {
        for (var e = 0; e < pResponse.Edits.length; e++) {
            for (var b = 0; b < CurrentPostsList.length; b++) {
                var PostLastModified = eval("new " + (pResponse.Edits[e].LastModified.replace(/\//g, "")));
                if (pResponse.Edits[e].Id === parseInt(CurrentPostsList[b]) && PostLastModified > this.LastModifiedTime) {
                    this.EditPost(pResponse.Edits[e]);
                }
            }
        }
    }

    // Count the number of posts currently being displayed.
    CurrentPostsList = this.GetPostList();

    // If the number of posts currently being displayed is larger than the number set in TotalPostsToShow, delete a post from the bottom of the list until only the correct number of posts are showing.
    while (CurrentPostsList.length > this.Options.TotalPostsToShow) {
        var LastPost = document.getElementById("RecentPostsWidget" + this.InstanceIndex).lastChild;
        LastPost.parentNode.removeChild(document.getElementById("RecentPostsWidget" + this.InstanceIndex).lastChild);
        CurrentPostsList = this.GetPostList();
    }

    // Get the time the event was last modified and format that time so it can be passed back to the ScribbleLive API.
    this.LastModifiedTime = eval("new " + (pResponse.LastModified.replace(/\//g, "")));
    
    // Make the call to the API for updates.
    var Wait = setTimeout("RecentPosts.GetInstance(" + this.InstanceIndex + ").GetNewPosts()", 31000);

};

// The function that adds a post.
RecentPosts.prototype.AddPost = function (pPost, pPostList) {
    // A huge if statement that decides if it should be showing a post or not based on the options set when the widget is loaded.
    if (
        (pPost.Type === "IMAGE" && !this.Options.ShowImages) ||
        (pPost.Type === "VIDEO" && !this.Options.ShowVideos) ||
        (pPost.Type === "AUDIO" && !this.Options.ShowAudio) ||
        (pPost.IsStuck === 1 && !this.Options.ShowStuckPosts) ||
        (pPost.Type === "TEXT" && !this.Options.ShowTextPosts) ||
        (pPost.Type === "POLL" && !this.Options.ShowPolls) ||
        (pPost.IsComment === 1 && !this.Options.ShowComments) ||
        (pPost.IsComment === 0 && !this.Options.ShowOfficialPosts) ||
        (pPost.Source.match("twitter") && !this.Options.ShowTweets) ||
        (!pPost.Source.match("twitter") && this.Options.ShowOnlyTweets) ||
        ((pPost.Source.match("mobile") || pPost.Source.match("SMS")) && !this.Options.ShowMobilePosts) ||
        (pPost.Source.match("www.facebook.com") && !this.Options.ShowFacebookPosts) ||
        (!pPost.Source.match("www.facebook.com") && this.Options.ShowOnlyFacebookPosts) ||
        (pPost.Type !== "POLL" && this.Options.ShowOnlyPolls)
    ) {
        return;
    }

    // If the post you are trying to add is already on the page, stop trying to add it.
    for (var c = 0; c < pPostList.length; c++) {
        if (pPost.Id === parseInt(pPostList[c])) {
            return;
        }
    }

    var IsTweet = pPost.Source.match("twitter");

    // Create a new list item with the post id as the id attribute.
    var NewListItem = document.createElement("li");
    NewListItem.id = pPost.Id;

    // If there is an avatar associated with the creator of the post, create an image tag with the avatar url as the src attribute.
    var NewAvatarImage;
    if (pPost.Creator.Avatar !== "" && this.Options.ShowAvatars) {
        NewAvatarImage = document.createElement("img");
        NewAvatarImage.src = pPost.Creator.Avatar;
    }

    var NewContentDiv = RecentPosts.__S.Render(pPost);

    // Create a div with the class of Meta that contains the creator name, the source, and the date and time of the post.
    var NewMetaDiv = document.createElement("div");
    NewMetaDiv.className = "Meta";
    var PostDate = eval("new " + (pPost.LastModified.replace(/\//g, "")));

    // Set the creator name.
        CreatorName = pPost.Creator.Name;
    

    var NewMetaDivContent = "by " + CreatorName;

    // Add the source of the post if there is one.
    if (pPost.Source !== "") {
        NewMetaDivContent += " via " + pPost.Source;
    }

    NewMetaDivContent += " on " + PostDate.toLocaleDateString() + " at " + PostDate.toLocaleTimeString();

    NewMetaDiv.innerHTML = NewMetaDivContent;

    // If there was an avatar, add the image tag to the list item.
    if (NewAvatarImage !== undefined && !IsTweet) {
        NewListItem.appendChild(NewAvatarImage);
    }

    // Add the content div to the list item.
    NewListItem.appendChild(NewContentDiv);

    // Add the meta div to the list item if ShowMetaData is set to true.
    if (this.Options.ShowMetaData && !IsTweet) {
        NewListItem.appendChild(NewMetaDiv);
    }

    // If there are no posts already on the page, add the posts in order. If there are posts, add the new post to the top.
    if (pPostList.length === 0) {
        document.getElementById("RecentPostsWidget" + this.InstanceIndex).appendChild(NewListItem);
    } else {
        document.getElementById("RecentPostsWidget" + this.InstanceIndex).insertBefore(NewListItem, document.getElementById("RecentPostsWidget" + this.InstanceIndex).firstChild);
    }
};


// The function that deletes a post.
RecentPosts.prototype.DeletePost = function (pPostId) {
    var PostToDelete = document.getElementById(pPostId);
    PostToDelete.parentNode.removeChild(PostToDelete);
    var CurrentPostsList = this.GetPostList();
    if (CurrentPostsList.length < this.Options.TotalPostsToShow) {
        document.getElementById("RecentPostsWidget" + this.InstanceIndex).innerHTML = "";
        this.GetAllPosts();
    }
};

// The function that edits a post by finding the matching post id and replacing the Content div html.
RecentPosts.prototype.EditPost = function (pPostToEdit) {
    var PostElements = document.getElementById(pPostToEdit.Id).getElementsByTagName("div");
    for (var i = 0; i < PostElements.length; i++) {
        if (PostElements[i].className === "Content") {

            $(PostElements[i]).replaceWith(RecentPosts.__S.Render(pPostToEdit));
        }
    }
};

// Create a list of posts currently on the page by finding all list items inside the RecentPostsWidget list and adding their ids to an array.
RecentPosts.prototype.GetPostList = function () {
    var CurrentPostsList = [];
    var CurrentPosts = document.getElementById("RecentPostsWidget" + this.InstanceIndex).children;
    for (var j = 0; j < CurrentPosts.length; j++) {
        CurrentPostsList.push(CurrentPosts[j].getAttribute("id"));
    }
    return CurrentPostsList;
};

// The recurring API call.
RecentPosts.prototype.GetNewPosts = function (pLastPostTime) {

    // Delete any API calls that are currently on the page.
    var Scripts = document.getElementsByTagName("head")[0].getElementsByTagName("script");
    for (var i = 0; i < Scripts.length; i++) {
        var ScriptSource = Scripts[i].src;
         if (ScriptSource.match("^\http:\/\/apiv1\.scribblelive\.com/event/" + this.Options.EventId + ".*") !== null) {
            document.getElementsByTagName("head")[0].removeChild(Scripts[i]);
        }
    }

    var LastModifiedTimeFormatted = this.LastModifiedTime.getUTCFullYear() + "/" + (this.LastModifiedTime.getUTCMonth() + 1) + "/" + this.LastModifiedTime.getUTCDate() + " " + this.LastModifiedTime.getUTCHours() + ":" + this.LastModifiedTime.getUTCMinutes() + ":" + this.LastModifiedTime.getUTCSeconds();

    // Add the new API call to the head of the page taking into account the event id, API token, and last post time.
    var LoadPostsCall = document.createElement("script");
    LoadPostsCall.type = "text/javascript";
    LoadPostsCall.src = "http://apiv1.scribblelive.com/event/" + this.Options.EventId + "/all/?Token=" + this.Options.APIToken + "&Order=asc&format=json&Since=" + LastModifiedTimeFormatted + "&callback=RecentPosts.GetInstance(" + this.InstanceIndex + ").DrawPosts";
    document.getElementsByTagName("head")[0].appendChild(LoadPostsCall);

};

// Add an empty list to the element specified in the setup at the top of this script.
RecentPosts.prototype.CreatePostList = function () {
    var PostList = document.createElement("ul");
    PostList.setAttribute("id", "RecentPostsWidget" + this.InstanceIndex);
    PostList.className = "SL-Posts";
    document.getElementById(this.Options.WhereToAddPosts).appendChild(PostList);
};

// The initial API call that gets all of the most recent posts and feeds them back into this script.
RecentPosts.prototype.GetAllPosts = function () {
    var LoadPostsCall = document.createElement("script");
    LoadPostsCall.type = "text/javascript";
    LoadPostsCall.src = "http://apiv1.scribblelive.com/event/" + this.Options.EventId + "/page/last/?Token=" + this.Options.APIToken + "&Max=" + this.Options.TotalPostsToShow + "&Order=asc&format=json&callback=RecentPosts.GetInstance(" + this.InstanceIndex + ").DrawPosts";
    document.getElementsByTagName("head")[0].appendChild(LoadPostsCall);
};