import { map, switchMap, tap } from 'rxjs/operators';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { combineLatest } from 'rxjs';

import { UserTrailStatusService } from '../../services/user-trail-status.service';
import { TrailsService } from '../../services/trails.service';
import { TrailStatus } from '../../interfaces/trail-status';
import { AuthService } from '../../services/auth.service';

import { Trail } from '../../interfaces/trail';

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
    user: any;
    completedTrails: Trail[] = [];
    interestedTrails: Trail[] = [];
    currentDate = new Date();
    firstDoM = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
    firstDoY = new Date(this.currentDate.getFullYear(), 0, 1);
    monthIds = [];
    yearIds = [];
    monthCompletion = 0;
    yearCompletion = 0;
    monthMileage = 0;
    yearMileage = 0;
    ATMileage = 0;
    monthAscent = 0;
    yearAscent = 0;
    ATAscent = 0;
    monthLongest = 0;
    yearLongest = 0;
    ATLongest = 0;
    monthHighest = 0;
    yearHighest = 0;
    ATHighest = 0;

    constructor(
        private userTrailStatusService: UserTrailStatusService,
        private trailService: TrailsService,
        private authService: AuthService,
        private router: Router
    ) { }

    ngOnInit() {
        this.authService.getAuthState().pipe(
            switchMap(authState => {
                this.user = authState;

                return this.userTrailStatusService.getTrailStatusByUserId(this.user.uid);
            }),
            switchMap((trailStatus: TrailStatus) => {
                const completedIds = [];
                const interestedIds = [];
                trailStatus.trails.forEach(trail => {
                    if (trail.status === 'completed') {
                        completedIds.push(trail.trailId);

                        if (trail.dateCompleted['seconds'] >= this.firstDoM.getUTCDate()) {
                            this.monthIds.push(trail.trailId);
                            this.monthCompletion++;
                        }

                        if (trail.dateCompleted['seconds'] >= this.firstDoY.getUTCDate()) {
                            this.yearIds.push(trail.trailId);
                            this.yearCompletion++;
                        }
                    } else {
                        interestedIds.push(trail.trailId);
                    }
                });

                return combineLatest(
                    this.trailService.getTrailsByIds(completedIds),
                    this.trailService.getTrailsByIds(interestedIds)
                );
            }),
            tap((data: [Trail[], Trail[]]) => {
                this.completedTrails = data[0];
                this.interestedTrails = data[1];

                this.completedTrails.forEach(trail => {
                    if (this.monthIds.indexOf(trail.id) !== -1) {
                        this.monthMileage += trail.length;
                        this.monthAscent += trail.ascent;

                        if (trail.length > this.monthLongest) {
                            this.monthLongest = trail.length;
                        }

                        if (trail.ascent > this.monthHighest) {
                            this.monthHighest = trail.ascent;
                        }
                    }

                    if (this.yearIds.indexOf(trail.id) !== -1) {
                        this.yearMileage += trail.length;
                        this.yearAscent += trail.ascent;

                        if (trail.length > this.yearLongest) {
                            this.yearLongest = trail.length;
                        }

                        if (trail.ascent > this.yearHighest) {
                            this.yearHighest = trail.ascent;
                        }
                    }

                    this.ATMileage += trail.length;
                    this.ATAscent += trail.ascent;

                    if (trail.length > this.ATLongest) {
                        this.ATLongest = trail.length;
                    }

                    if (trail.ascent > this.ATHighest) {
                        this.ATHighest = trail.ascent;
                    }
                });
            })
        ).subscribe();
    }

    goToTrailDetails(trail: Trail) {
        this.router.navigate(['/trail-details', {id: trail.id}]);
    }

}
