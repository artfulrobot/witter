(function($){

  Drupal.behaviors.witter = {
    attach: function (context, settings) {

      // Parse comments.
      var witters = {};
      $(context).find('*[data-witter-location]').each(function(){
        var location = $(this).data('witter-location');
        if (! (location in witters)) {
          witters[location] = [];
        }
        witters[location].push({
          text: $(this).find('.field-name-comment-body .field-item').html(),
          who: $(this).data('witter-who'),
          own: $(this).data('witter-own'),
          cid: $(this).data('witter-cid')
        });
      });
      window.witters = witters;

      var nids = [];

      // Find requests for comments.
      var comments = $(context).find('a[name]').filter(function() {
          return (this.id.match(/^chat-[a-zA-Z0-9_-]+$/));
      }).each(function(){
        var location = this.id;

        // Find the node this belongs to.
        var nid = $(this).closest('*[data-witter-nid]').data('witter-nid');
        if (!nid) {
          return;
        }
        if (nids.indexOf(nid) == -1) {
          nids.push(nid);
        }
        var username = $(this).closest('*[data-witter-name]').data('witter-name');

        // If this is inside a <p> let's escape that.
        var vueAppElement = this;
        if ($(this).parent()[0].tagName == 'P') {
          vueAppElement = $('<div/>').insertAfter($(this).parent())[0];
        }

        this.vueCommentApp = new Vue({
          el: vueAppElement,
          data: function() {
            return { comments:witters[location] || [], newComment:'', username };
          },
          mounted: function() {
          },
          methods: {
            postComment: function(e) {
              e.preventDefault();
              e.stopPropagation();
              this.$http.post('/witter/' + nid, {op:'add', location, comment:this.newComment})
                .then(
                  function(response) {
                    this.newComment = '';
                    this.comments.push(response.body);
                  },
                  function(response) { alert("Sorry, failed to save comment. Um, try again? If you think you could have been logged out, open another tab and log in again then try to save the comment again."); }
                );
            },
            deleteComment: function(cid, e) {
              e.preventDefault();
              e.stopPropagation();
              this.$http.post('/witter/' + nid, {op: 'delete', cid})
                .then(
                  function(response) {
                    if (response.body.success) {
                      // Find the index of this comment and remove it.
                      var i = this.comments.length - 1;
                      while (i>-1) {
                        if (parseInt(this.comments[i].cid) == parseInt(cid)) {
                          this.comments.splice(i,1);
                          break;
                        }
                        i--;
                      }
                    }
                    else {
                      alert("Failed to delete comment - perhaps a permission problem.");
                    }
                  },
                  function(response) {alert("Failed to delete comment");}
                );
            }
          },
          template: `<div class="witter">
              <table class="witter__comments">
              <transition-group name="witter-fade" tag="tbody">
                <tr v-for="comment in comments" :key="comment.cid">
                  <td class="witter__name">{{comment.who}}</td>
                  <td class="witter__text" v-html="comment.text"></td>
                  <td class="witter__delete"><a v-if="comment.own" href @click="deleteComment(comment.cid, $event)" title="Delete comment">&times;</a></td>
                </tr>
              </transition-group>
                <tr>
                  <td class="witter__name">{{ username }}</td>
                  <td class="witter__text"><form><div>
                    <textarea v-model="newComment" ></textarea>
                    <button v-on:click="postComment">Save Comment</button>
                  </div></form></td>
                </tr>
              </tbody>
              </table>
            </div>`
        });

      });
      // If we have any of our chat-NNN tags, remove comments UI.
      if (comments.length) {
        // Remove the comments UI.
        $('#comments, li.comment-add').remove();
      }

      // still in attach()
      window.setInterval(function() {
        $.getJSON('/witter/' + nids[0] + '?op=reload', function(response) {
          if (response.comments) {
            $.each(response.comments, function (location, comments) {

              witters[location].splice(0, witters[location].length);
              $.map(comments, function(c) { witters[location].push(c); });
              return;

              /* lodash merge code. Turned out that the cid was being returned
               * as a string not an int and this was causing Vue to not
               * understand that it was the same comment.
              // Remove comments that have been deleted.
              for (var i = witters[location].length - 1;i--; i>-1) {
                if (!_.find(comments, {cid: witters[location][i].cid})) {
                  // comment has been deleted.
                  console.log("removing ", JSON.stringify(witters[location][i]));
                  witters[location].splice(i,1);
                }
              }
              _.each(_.differenceBy(comments, witters[location], 'cid'), function(c) {
                console.log("adding", c);
                witters[location].push(c);
              });
              */


              //var x= Vue.set(witters, location, comments);
            })
          }
        })
      }, 5000);
    }
  };


})(jQuery);
