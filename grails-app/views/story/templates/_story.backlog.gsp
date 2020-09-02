%{--
- Copyright (c) 2015 Kagilum.
-
- This file is part of iceScrum.
-
- iceScrum is free software: you can redistribute it and/or modify
- it under the terms of the GNU Affero General Public License as published by
- the Free Software Foundation, either version 3 of the License.
-
- iceScrum is distributed in the hope that it will be useful,
- but WITHOUT ANY WARRANTY; without even the implied warranty of
- MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
- GNU General Public License for more details.
-
- You should have received a copy of the GNU Affero General Public License
- along with iceScrum.  If not, see <http://www.gnu.org/licenses/>.
-
- Authors:
-
- Vincent Barrier (vbarrier@kagilum.com)
- Nicolas Noullet (nnoullet@kagilum.com)
--}%

<script type="text/ng-template" id="story.backlog.html">
<div is-watch="story"
     ng-class="{ 'is-selected': isSelected(story) }"
     selectable-id="{{:: story.id }}"
     ng-repeat="story in backlogStories | search"
     as-sortable-item
     class="sticky-note-container sticky-note-story">
    <div ng-include="'story.html'"></div>
</div>
<div ng-if="backlog.storiesLoaded && (application.search && backlog.stories.length != 0 && (backlog.stories | search).length == 0 || backlog.stories.length == 0 && application.context)" class="empty-view">
    <p class="form-text">
        ${message(code: 'todo.is.ui.backlog.search.empty')}
        <strong>{{ application.search }}</strong>
        <strong ng-if="application.context"><i class="fa fa-tag" ng-class="application.context.type | contextIcon"></i> {{ application.context.term }}</strong>
    </p>
    <button class="btn btn-secondary"
            ng-click="clearContextAndSearch()">
        ${message(code: 'todo.is.ui.search.clear')}
    </button>
</div>
<div ng-if="backlog.storiesLoaded && backlog.stories.length == 0 && !application.context" class="empty-view">
    <div ng-include="emptyBacklogTemplate"></div>
</div>
<div class="loading-dot dot-elastic align-middle align-self-center" ng-if="!backlog.storiesLoaded"></div>
</script>

<script type="text/ng-template" id="story.backlog.close.empty.html">
</script>

<script type="text/ng-template" id="story.backlog.backlogs.empty.html">
<p class="form-text">
    {{:: message('todo.is.ui.story.empty.backlogs.' + backlog.code, [], 'todo.is.ui.story.empty.backlogs.default') }}
    <entry:point id="story-backlog-empty"/>
</p>
<a class="btn btn-primary"
   ng-if="authorizedStory('create')"
   href="#/backlog/sandbox/story/new">
    {{:: message('todo.is.ui.story.new' + (backlog.code == backlogCodes.SANDBOX ? '' : '.sandbox')) }}
</a>
</script>

<script type="text/ng-template" id="story.backlog.planning.empty.html">
<div ng-if="sprint.state < sprintStatesByName.DONE">
    <p class="form-text">${message(code: 'todo.is.ui.story.empty.planning')}</p>
    <button class="btn btn-primary"
            type="button"
            ng-click="openPlanModal(sprint)"
            ng-if="authorizedSprint('plan', sprint)">
        ${message(code: 'todo.is.ui.story.plan')}
    </button>
</div>
</script>

<script type="text/ng-template" id="story.backlog.plan.empty.html">
<p class="form-text">${message(code: 'todo.is.ui.story.empty.plan')}</p>
<a class="btn btn-primary"
   ng-click="$close()"
   href="#/backlog/backlog">
    <i class="fa fa-inbox"></i> ${message(code: 'is.ui.backlog')}
</a>
</script>
