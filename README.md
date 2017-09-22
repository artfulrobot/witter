# Witter

Get simple comments running throughout a page, with a slick ajax UI. See
comments come in from others as they happen (well, ok, every 5s).

## Quick start

Add a field called `field_comment_location` to comments.

Take a node with comments enabled.

Add an anchor into some text with a name starting `chat-`, e.g.
    <a name="chat-foo" id="chat-foo" />

You should then have an ajaxed comments box. You can put as many chat anchors as
you like on a page, so long as they have unique names.

Comments are stored using the normal comment API, it's just that javascript
repositions them. Users can delete their own comments (if they have the edit own
comments permission).


