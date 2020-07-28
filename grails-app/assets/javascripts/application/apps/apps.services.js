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

services.service("AppService", ['Session', 'FormService', 'WorkspaceType', function(Session, FormService, WorkspaceType) {
    var self = this;
    this.updateEnabledForProject = function(appDefinition, project, enabledForProject) {
        return FormService.httpPost('app/updateEnabledForProject', {appDefinitionId: appDefinition.id, enabledForProject: enabledForProject}).then(function() {
            var updatedAppDefinition = _.find(project.simpleProjectApps, {appDefinitionId: appDefinition.id});
            if (!updatedAppDefinition) {
                updatedAppDefinition = {appDefinitionId: appDefinition.id, availableForServer: true, enabledForServer: true};
                project.simpleProjectApps.push(updatedAppDefinition);
            }
            updatedAppDefinition.enabled = enabledForProject;
        });
    };
    this.getAppDefinitions = function() {
        return FormService.httpGet('app/definitions', null, true);
    };
    this.getAppDefinitionsWithProjectSettings = function(project) {
        return self.getAppDefinitions().then(function(appDefinitions) {
            return _.filter(appDefinitions, function(appDefinition) {
                return self.authorizedApp('updateProjectSettings', appDefinition, project)
            });
        });
    };
    this.isEnabledApp = function(appDefinition, project) {
        return appDefinition.availableForServer && appDefinition.enabledForServer && (!appDefinition.isProject || self.authorizedApp('use', appDefinition.id, project));
    };
    this.authorizedApp = function(action, appDefinitionOrId, project) {
        switch (action) {
            case 'show':
                return Session.authenticated() && Session.workspaceType === WorkspaceType.PROJECT;
            case 'enableForProject':
                var appDefinition = appDefinitionOrId;
                return Session.poOrSm() && appDefinition && appDefinition.availableForServer && appDefinition.enabledForServer && appDefinition.isProject;
            case 'askToEnableForProject':
                var appDefinition = appDefinitionOrId;
                return Session.tm() && !Session.admin() && appDefinition && appDefinition.availableForServer && appDefinition.enabledForServer && appDefinition.isProject;
            case 'updateProjectSettings':
                var appDefinition = appDefinitionOrId;
                return self.authorizedApp('enableForProject', appDefinition) && self.authorizedApp('use', appDefinition.id, project) && appDefinition.projectSettings;
            case 'use':
                var appDefinitionId = appDefinitionOrId;
                return !!(project && _.find(project.simpleProjectApps, {appDefinitionId: appDefinitionId, availableForServer: true, enabledForServer: true, enabled: true}));
            default:
                return false;
        }
    };
}]);