class Kin.DayCare.InvitesView extends Backbone.View

  el: null

  tplUrl: '/templates/main/day_care/invites.html'

  events:
    "submit #send-invite-form" : "sendInvite"

  initialize: ()->

  render: ()->
    that = @
    $.tmpload
      url: @tplUrl
      onLoad: (tpl)->
        $(that.el).html(tpl())
        that.friendRequestsList = new Kin.Profile.FriendRequestsListView
          el: that.$("#friend-requests-list")
          collection: that.collection
        that.renderFriendRequestsList()

  renderFriendRequestsList: ()->
    that = @
    that.friendRequestsList.collection.fetch
      success: ()->
        that.friendRequestsList.render()

  sendInvite: (ev)->
    ev.preventDefault()
    that = @
    $form = $(ev.target)
    formData = $form.serialize()
    friendRequestModel = new Kin.FriendRequestModel
    friendRequestModel.save null,
      data: formData
      success: ()->
        parentName = $form.find("input[name='name']").val()
        parentSurname = $form.find("input[name='surname']").val()
        $form.find("input[type='text']").val("")
        $.jGrowl("Invite successfully sent to #{parentName} #{parentSurname}")
        that.renderFriendRequestsList()
      error: ()->
        $.jGrowl("Invite could not be sent :( Please try again.")

  remove: ()->
    @unbind()
    $(@el).unbind().empty()