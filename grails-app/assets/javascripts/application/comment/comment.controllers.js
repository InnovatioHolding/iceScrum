/*
 * Copyright (c) 2014 Kagilum SAS.
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
controllers.controller('commentCtrl', ['$scope', 'CommentService', 'hotkeys', 'WorkspaceType', function($scope, CommentService, hotkeys, WorkspaceType) {
    // Functions
    $scope.resetCommentForm = function() {
        $scope.editableComment = $scope.comment ? $scope.comment : {};
        $scope.formHolder.editing = false;
        $scope.resetFormValidation($scope.formHolder.commentForm);
    };
    $scope.formEditable = function() {
        return $scope.comment ? $scope.authorizedComment('update', $scope.editableComment) : false
    };
    $scope.formDeletable = function() {
        return $scope.comment ? $scope.authorizedComment('delete', $scope.editableComment) : false
    };
    $scope.save = function(comment, commentable) {
        CommentService.save(comment, commentable, $scope.commentWorkspace.id, $scope.commentWorkspaceType).then(function() {
            $scope.resetCommentForm();
            $scope.notifySuccess('todo.is.ui.comment.saved');
        });
    };
    $scope['delete'] = function(comment, commentable) {
        CommentService.delete(comment, commentable, $scope.commentWorkspace.id, $scope.commentWorkspaceType).then(function() {
            $scope.notifySuccess('todo.is.ui.deleted');
        });
    };
    $scope.authorizedComment = CommentService.authorizedComment;
    $scope.editForm = function(value) {
        $scope.formHolder.editing = $scope.formEditable() && value;
        if (value) {
            $scope.editableComment = angular.copy($scope.comment);
        }
    };
    $scope.editCommentBody = function() {
        if ($scope.formEditable()) {
            $scope.editForm(true);
            $scope.showCommentBodyTextarea = true;
        }
    };
    $scope.blurComment = function() {
        $scope.showCommentBodyTextarea = false;
    };
    $scope.update = function(comment, commentable) {
        if (!$scope.formHolder.commentForm.$invalid) {
            $scope.editForm(false);
            if ($scope.formHolder.commentForm.$dirty) {
                CommentService.update(comment, commentable, $scope.commentWorkspace.id, $scope.commentWorkspaceType).then(function() {
                    $scope.notifySuccess('todo.is.ui.comment.updated');
                });
            }
        }
    };
    $scope.expandCommentEditor = function() {
        if ($scope.authorizedComment('create')) {
            $scope.formHolder.formExpanded = true;
        } else {
            $scope.logIn();
        }
    };
    $scope.menus = [
        {
            name: 'default.button.delete.label',
            deleteMenu: true,
            visible: function() { return true },
            action: function(comment) {
                $scope.delete(comment, comment.commentable);
            }
        }
    ];
    $scope.markitupCheckboxOptions = function(property, action) {
        return {
            options: {
                object: function() { return $scope.editableComment; },
                property: property ? property : 'body',
                action: action ? action : function(comment) {
                    $scope.formHolder.commentForm.$dirty = true;
                    $scope.update(comment);
                },
                autoSubmit: function() { return true; },
                isEnabled: function() { return $scope.formEditable(); }
            }
        }
    };
    // Init
    $scope.formHolder = {};
    $scope.resetCommentForm();
    if (!$scope.commentWorkspace) {
        $scope.commentWorkspace = $scope.getProjectFromState();
        $scope.commentWorkspaceType = WorkspaceType.PROJECT;
    }
}]);
