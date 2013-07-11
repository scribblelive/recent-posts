Introduction

Most of you probably want to get up and running as quick as possible, here's how.
Details
The Script Tag

Add the main SLRecentPosts.js to the head of your page, and the tag below wherever you like below that.

<script type="text/javascript">

    var First = new RecentPosts?({

        APIToken: "", EventId: "", TotalPostsToShow: 10, WhereToAddPosts: "" 

    }); 

</script>

The Script Tag Break Down

var First = new RecentPosts

The variable name can be anything you like. It allows you to add more than one of these widgets to the same page. Give each instance a different variable name and you're good to go.

APIToken

To get an API token you must have a ScribbleLive? account. Log in to https://client.scribblelive.com, go to the API section, and either grab a token if you already have one or generate a new one.

EventId

The id of the ScribbleLive? event you would like to display. You can find this by logging in to https://client.scribblelive.com, and going to the API section of your event. The id it at the top of the API section.

TotalPostsToShow

The number of posts you'd like to show in integer form. If left blank it will default to 10. On load it will load the newest x posts. It will keep the list at x posts by deleting the older posts as new posts are added.

WhereToAddPosts

This is the id of the DOM element on your page that you would like to add the list of posts to. No hash tag required, just "DOMElementID".
That's It!

Add the scripts to your page, set the options correctly, and you're good to go. 