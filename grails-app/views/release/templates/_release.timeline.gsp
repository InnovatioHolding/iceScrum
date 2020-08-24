%{--
- Copyright (c) 2016 Kagilum.
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
<script type="text/ng-template" id="release.timeline.html">
<div class="timeline-bar-container">
    <div class="progress timeline-bar">
        <a href="{{ sprint.id ? openSprintUrl(sprint) : '' }}"
           ng-repeat="sprint in releaseParts"
           class="progress-bar bg-{{ sprint.id ? { 1: 'todo', 2: 'inProgress', 3: 'done' }[sprint.state] : 'invisible' }}"
           ng-class="{'disabled-link':!sprint.id, 'last-bar': $last}"
           uib-tooltip-template="'sprint.tooltip.html'"
           tooltip-enable="sprint.id"
           tooltip-placement="top"
           ng-style="{width: (sprint.duration / release.duration * 100) + '%'}">
            {{ sprint.id ? sprint.index : '' }}
        </a>
        <div class="m-auto" ng-if="release.sprints != undefined && release.sprints.length == 0">${message(code: 'todo.is.ui.nosprint')}</div>
    </div>
</div>
</script>
