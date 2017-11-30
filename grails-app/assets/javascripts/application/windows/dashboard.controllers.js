/*
 * Copyright (c) 2016 Kagilum SAS.
 *
 * This file is part of iceScrum.
 *
 * iceScrum is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License.
 *
 * iceScrum is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with iceScrum.  If not, see <http://www.gnu.org/licenses/>.
 *
 * Authors:
 *
 * Vincent Barrier (vbarrier@kagilum.com)
 * Nicolas Noullet (nnoullet@kagilum.com)
 *
 */

controllers.controller('dashboardCtrl', ['$scope', '$location', '$state', '$q', 'ProjectService', 'ReleaseService', 'SprintService', 'AttachmentService', 'StoryService', 'project', '$controller', function($scope, $location, $state, $q, ProjectService, ReleaseService, SprintService, AttachmentService, StoryService, project, $controller) {
    $scope.authorizedProject = function(action, project) {
        return ProjectService.authorizedProject(action, project);
    };
    $scope.authorizedRelease = function(action, release) {
        return ReleaseService.authorizedRelease(action, release);
    };
    $scope.authorizedSprint = function(action, sprint) {
        return SprintService.authorizedSprint(action, sprint);
    };
    $scope.openSprintUrl = function(sprint) {
        var stateName = 'planning.release.sprint.withId';
        if ($state.current.name != 'planning.release.sprint.withId.details') {
            stateName += '.details';
        }
        return $state.href(stateName, {sprintId: sprint.id, releaseId: sprint.parentRelease.id});
    };
    $scope.showMore = function() {
        $scope.pref.showMore = true;
    };
    $scope.openFromId = function(activity) {
        if (activity.parentType == 'story') {
            StoryService.getURL(activity.parentRef).then(function(data) {
                $location.url(data.relativeUrl);
            });
        }
    };
    // Init
    $scope.pref = {
        showMore: false
    };
    $scope.release = {};
    $scope.activities = [];
    $scope.currentOrLastSprint = {};
    $scope.currentOrNextSprint = {};
    $scope.projectMembersCount = 0;
    $scope.project = project;
    $scope.$watch(function() {
        return _.unionBy($scope.project.team.members, $scope.project.productOwners, 'id');
    }, function(newAllMembers) {
        $scope.allMembers = newAllMembers;
    }, true);
    $controller('attachmentCtrl', {$scope: $scope, attachmentable: project, clazz: 'project', project: project});
    ProjectService.getActivities($scope.project).then(function(activities) {
        $scope.activities = activities;
    });
    // Promises are chained like so to wait for request completion and avoid redundant queries to the server
    ReleaseService.getCurrentOrNextRelease($scope.project).then(function(release) {
        $scope.release = release;
        return (release && release.id) ? SprintService.list(release) : $q.when();
    }).then(function() {
        // Needs a separate call because it may not be in the currentOrNextRelease
        return SprintService.getCurrentOrLastSprint($scope.project).then(function(sprint) {
            $scope.currentOrLastSprint = sprint;
        });
    }).then(function() {
        SprintService.getLastSprint($scope.project).then(function(sprint) {
            $scope.lastSprint = sprint;
        });
        SprintService.getCurrentOrNextSprint($scope.project).then(function(sprint) {
            $scope.currentOrNextSprint = sprint;
        });
    });
    AttachmentService.list($scope.project, $scope.project.id);
    if (isSettings.showAppStore) {
        $scope.showAppsModal();
    }
}]);
