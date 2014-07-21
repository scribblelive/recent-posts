ScribbleLive Recent Posts Widget
===========
A javascript that communicates with the ScribbleLive API to get the posts from a specific event. You must be a ScribbleLive enterprise client with access to the ScribbleLive API. You will need a valid API Token.

You can pass in various options like how many posts to show and what types of posts to show. You also have total control over how the posts are displayed.

**__Creator: Matt Mccausland__**

##Introduction


Most of you probably want to get up and running as quick as possible, here's how.

###The Script Tag


Add the main SLRecentPosts.js to the head of your page, and the tag below wherever you like below that.

```HTML
<script type="text/javascript">

    var First = new RecentPosts({

        APIToken: "", EventId: "", TotalPostsToShow: 10, WhereToAddPosts: "" 

    }); 

</script>
```

###The Script Tag Break Down


__var First = new RecentPosts__

The variable name can be anything you like. It allows you to add more than one of these widgets to the same page. Give each instance a different variable name and you're good to go.

__APIToken__

To get an API token you must have a ScribbleLive account. Log in to https://client.scribblelive.com, go to the API section, and either grab a token if you already have one or generate a new one.

__EventId__

The id of the ScribbleLive event you would like to display. You can find this by logging in to https://client.scribblelive.com, and going to the API section of your event. The id it at the top of the API section.

__TotalPostsToShow__

The number of posts you'd like to show in integer form. If left blank it will default to 10. On load it will load the newest x posts. It will keep the list at x posts by deleting the older posts as new posts are added.

__WhereToAddPosts__

This is the id of the DOM element on your page that you would like to add the list of posts to. No hash tag required, just "DOMElementID".
That's It!

__Add the scripts to your page, set the options correctly, and you're good to go.__
