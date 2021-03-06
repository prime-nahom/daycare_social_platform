class Kin.CommentModel extends Backbone.Model

  defaults:
    from_id:    null
    to_id:      null
    wall_id:    null
    type:       "status"
    privacy:    "private"
    content:    null
    created_at: null
    updated_at: null
    from_user:  {}

  urlRoot: "/comment"

  initialize: ()->
    if @collection
      @set({wall_id: @collection.profileId})

  url: ()->
    id = @id or ""
    "#{@urlRoot}/#{id}"