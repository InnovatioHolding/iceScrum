/*
 * Copyright (c) 2017 Kagilum SAS.
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
extensibleController('appsCtrl', ['$scope', 'AppService', 'Session', '$window', '$timeout', '$uibModal', function($scope, AppService, Session, $window, $timeout, $uibModal) {
    // Functions
    $scope.openAppDefinition = function(appDefinition) {
        $scope.appDefinition = appDefinition;
    };
    $scope.searchApp = function(appSearch) {
        $scope.holder.appSearch = appSearch;
    };
    $scope.updateEnabledForProject = function(appDefinition, enabledForProject) {
        AppService.updateEnabledForProject(appDefinition, $scope.project, enabledForProject).then(function() {
            appDefinition.enabledForProject = enabledForProject;
            if (enabledForProject && appDefinition.projectSettings) {
                $scope.holder.displaySettingsWarning = appDefinition.id;
            }
            if (appDefinition.reloadUIOnStateChange) {
                $scope.notifySuccess('is.ui.apps.settings.refresh');
                $timeout(function() {
                    $window.location.reload();
                }, 600);
            } else if ($scope.closeModalOnEnableApp && !appDefinition.projectSettings) {
                $timeout(function() {
                    $scope.$close();
                }, 200);
            }
        });
    };
    $scope.appDefinitionFilter = function(appDefinition) {
        var search = $scope.holder.appSearch;
        if (search) {
            var containsText = function(text, subText) {
                return _.deburr(text).toLowerCase().indexOf(_.deburr(subText).toLowerCase()) !== -1;
            };
            var textContainsSearch = _.some(['name', 'baseline'], function(attributeName) {
                return containsText(appDefinition[attributeName], search);
            });
            var tagContainsSearch = _.some(appDefinition.tags, function(tag) {
                return containsText(tag, search);
            });
            return textContainsSearch || tagContainsSearch;
        } else {
            return true;
        }
    };
    $scope.openAppProjectSettings = function(appDefinition) {
        $scope.$close();
        $scope.showProjectEditModal(appDefinition.id);
    };
    $scope.isEnabledApp = function(appDefinition) {
        return AppService.isEnabledApp(appDefinition, $scope.project);
    };
    $scope.isEnabledForProject = function(appDefinition) {
        return AppService.authorizedApp('use', appDefinition.id, $scope.project);
    };
    $scope.showScreenshot = function(appDefinition, screenshot) {
        $uibModal.open({
            templateUrl: "app.details.screenshot.html",
            size: 'lg',
            controller: ['$scope', function($scope) {
                $scope.title = appDefinition.name;
                $scope.srcURL = screenshot;
            }]
        });
    };
    // Init
    $scope.appsOrder = ['-isNew', 'name'];
    $scope.project = $scope.getProjectFromState();
    $scope.holder = {};
    $scope.appDefinitions = [];
    AppService.getAppDefinitions().then(function(appDefinitions) {
        if (appDefinitions.length > 0) {
            $scope.appDefinitions = appDefinitions;
            if ($scope.defaultSearchTerm) {
                $scope.searchApp($scope.defaultSearchTerm);
            } else if ($scope.defaultAppDefinitionId) {
                $scope.appDefinition = _.find($scope.appDefinitions, {id: $scope.defaultAppDefinitionId});
            }
        }
    });
}]);

