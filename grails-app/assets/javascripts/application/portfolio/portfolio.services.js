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

services.factory('Portfolio', ['Resource', function($resource) {
    return $resource('/portfolio/:id/:action');
}]);

services.service('PortfolioService', ['Portfolio', 'Session', 'FormService', 'ProjectService', '$q', 'IceScrumEventType', 'WorkspaceType', 'CacheService', 'Project', function(Portfolio, Session, FormService, ProjectService, $q, IceScrumEventType, WorkspaceType, CacheService, Project) {
    var self = this;
    var crudMethods = {};
    crudMethods[IceScrumEventType.CREATE] = function(portfolio) {
        CacheService.addOrUpdate('portfolio', portfolio);
    };
    crudMethods[IceScrumEventType.UPDATE] = function(portfolio) {
        if (Session.workspaceType === WorkspaceType.PORTFOLIO) {
            var workspace = Session.getWorkspace();
            if (workspace.id == portfolio.id && workspace.fkey != portfolio.fkey) {
                document.location = document.location.href.replace(workspace.fkey, portfolio.fkey);
            }
        }
        CacheService.addOrUpdate('portfolio', portfolio);
    };
    crudMethods[IceScrumEventType.DELETE] = function(portfolio) {
        CacheService.remove('portfolio', portfolio.id);
    };
    this.list = function(params) {
        if (!params) {
            params = {};
        }
        params.paginate = true;
        return Portfolio.get(params, function(data) {
            self.mergePortfolios(data.portfolios);
        }).$promise;
    };
    this.save = function(portfolio) {
        portfolio.class = 'portfolio';
        return Portfolio.save(portfolio, crudMethods[IceScrumEventType.CREATE]).$promise;
    };
    this.update = function(portfolio) {
        return Portfolio.update({id: portfolio.id}, {portfoliod: portfolio}, crudMethods[IceScrumEventType.UPDATE]).$promise;
    };
    this['delete'] = function(portfolio) {
        return Portfolio.delete({id: portfolio.id}, crudMethods[IceScrumEventType.DELETE]).$promise;
    };
    this.listProjects = function(portfolio) {
        if (_.isEmpty(portfolio.projects)) {
            return ProjectService.listByPortfolio(portfolio.id).then(function(projects) {
                portfolio.projects = projects;
                portfolio.projects_count = portfolio.projects.length;
                return projects;
            });
        } else {
            return $q.when(portfolio.projects);
        }
    };
    this.listProjectsWidget = function(portfolio) {
        // Don't use ProjectService as it will empty sub-associations like backlogs on each project in order to have a synced cache
        return Project.listByPortfolio({portfolioId: portfolio.id}).$promise;
    };
    this.getSynchronizedProjects = function(projects) {
        return FormService.httpGet('portfolio/synchronizedProjects', {params: {projects: _.map(projects, 'id')}}, true);
    };
    this.mergePortfolios = function(portfolios) {
        _.each(portfolios, crudMethods[IceScrumEventType.CREATE]);
    };
    this.openChart = function(portfolio, chart) {
        return FormService.httpGet('portfolio/' + portfolio.id + '/' + chart, null, true);
    };
    this.authorizedPortfolio = function(action) {
        switch (action) {
            case 'edit':
            case 'update':
            case 'delete':
            case 'updateMembers':
                return Session.bo();
            default:
                return false;
        }
    };
}]);