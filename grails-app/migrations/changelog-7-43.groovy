/*
* Copyright (c) 2019 Kagilum SAS
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
* Nicolas Noullet (nnoullet@kagilum.com)
* Vincent BARRIER (vbarrier@kagilum.com)
*
*/
databaseChangeLog = {
    changeSet(author: "vbarrier", id: "update_portfolio_framework_default") {
        grailsChange {
            change {
                sql.execute("UPDATE is_portfolio SET framework = 'DEFAULT' WHERE framework IS NULL")
            }
        }
    }
    changeSet(author: "vbarrier", id: "update_task_in_progress_date") {
        grailsChange {
            change {
                sql.execute("UPDATE is_task SET in_progress_date = done_date WHERE in_progress_date IS NULL AND done_date IS NOT NULL")
            }
        }
    }
}