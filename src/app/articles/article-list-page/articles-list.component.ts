import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { SeoService } from 'src/app/services/seo.service';
import { Tag } from '../article.model';
import { ArticleService } from '../article.service';
import { MatDialog } from '@angular/material/dialog'
import { ActivatedRoute, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from 'src/app/user/auth.service';
import { Subscription } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { LoadEnvService } from 'src/app/services/load-env.service';
import { BaseArticleListComponent } from '../../shared/base-article-list/base-article-list.component';
import { NavigationService } from '../../services/navigation.service';

@Component({
  selector: 'app-articles-list',
  templateUrl: './articles-list.component.html',
  styleUrls: ['./articles-list.component.css'],
})
export class ArticlesListComponent extends BaseArticleListComponent implements OnInit, OnDestroy {
  public tagList!: Tag[];

  RECENT = 'recent';
  POPULAR = 'popular';
  TRENDING = 'trending';
  TAGS = 'tags';

  dddSponsorContentSourceUrl = 'assets/images/ddd-imagee.svg'

  public noArticlesAvailable!: boolean;
  public loadArticlesErrorMessage!: boolean;

  public activePage: string = this.RECENT;
  public mainPage = true;

  public openedTagsDropdown = false;
  public activeTag!: string;


  public tags$!: Subscription;
  public articles$!: Subscription;
  public status!: string;
  public tag!: string;

  constructor(
    public loadEnvService: LoadEnvService,
    public seo: SeoService,
    public articleService: ArticleService,
    public dialogEntryRef: MatDialog,
    public dialogDeleteRef: MatDialog,
    public router: Router,
    public route: ActivatedRoute,
    public authService: AuthService,
    public translate: TranslateService,
    public navigate: NavigationService,
    @Inject(PLATFORM_ID) public platformId: any
  ) {
    super(loadEnvService, seo, articleService, router, route, authService, translate, navigate, dialogEntryRef, dialogDeleteRef, platformId)
  }

  public fetchListOfTags(): void {
    this.loading = true;
    this.tags$ = this.articleService
      .getListOfTags()
      .subscribe({
        next: (response: Tag[]) => {
          this.tagList = response
          this.loading = false;
        },
        error: (_error: HttpErrorResponse) => {
          this.loading = false;
        }
      })
  }

  public sortByTag(tagName: any): void {
    this.openedTagsDropdown = false;
    this.activeTag = tagName;

    this.router.navigateByUrl(`/articles?tag=${tagName}`)

    this.scrollyPageNumber = 0;
    this.notEmptyArticles = true;
  }

  public fetchRecentArticles(): void {
    this.loading = true;
    this.articles$ = this.articleService
      .findAllRecentArticles(this.pageNumber, this.pageItemsLimit)
      .subscribe(this.handleFetchedArticles)
  }

  public fetchPopularArticles(): void {
    this.loading = true;
    this.articles$ = this.articleService
      .findAllArticlesByPopularity(this.pageNumber, this.pageItemsLimit)
      .subscribe(this.handleFetchedArticles)
  }

  public fetchArticlesByTag(tagName: string): void {
    this.loading = true;
    this.articles$ = this.articleService
      .findAllArticlesByTag(this.pageNumber, this.pageItemsLimit, tagName)
      .subscribe(this.handleFetchedArticles)
  }

  public sortBy(trendName: string): void {
    this.activeTag = '';

    if (trendName === this.RECENT) {
      this.activePage = this.RECENT;
      this.router.navigateByUrl('/articles');
    }

    if (trendName === this.POPULAR) {
      this.activePage = this.POPULAR
      this.router.navigateByUrl(`/articles?sortBy=${trendName}`);
    }

    if (trendName === this.TRENDING) {
      this.activePage = this.TRENDING
      this.router.navigateByUrl('/articles');
    }

    if (trendName === this.TAGS) {
      this.activePage = this.TAGS
      this.openedTagsDropdown = !this.openedTagsDropdown;
    } else {
      this.openedTagsDropdown = false;
    }

    this.scrollyPageNumber = 0;
    this.notEmptyArticles = true;
  }

  public fetchMoreArticles() {
    this.scrollyPageNumber += 1;
    const queryParamOne = this.route.snapshot.queryParamMap.get('sortBy')!;
    const queryParamTwo = this.route.snapshot.queryParamMap.get('tag')!;

    if (queryParamOne === this.POPULAR) {
      this.articleService.findAllArticlesByPopularity(this.scrollyPageNumber, this.pageItemsLimit)
        .subscribe((response: any) => this.handleNewFetchedArticles(response));
      return
    }

    if (queryParamTwo) {
      this.articleService.findAllArticlesByTag(this.scrollyPageNumber, this.pageItemsLimit, queryParamTwo)
        .subscribe((response: any) => this.handleNewFetchedArticles(response));
      return
    }

    this.articleService.findAllRecentArticles(this.scrollyPageNumber, this.pageItemsLimit)
      .subscribe((response: any) => this.handleNewFetchedArticles(response));
  }


  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.fetchListOfTags()

      this.route.queryParamMap.subscribe(
        query => {
          this.status = query.get('sortBy')!;
          this.tag = query.get('tag')!;

          if (this.tag) {
            return this.fetchArticlesByTag(this.tag);
          }

          if (!this.status) {
            this.activePage ||= this.RECENT;
            return this.fetchRecentArticles();
          }

          if (this.status == this.POPULAR) {
            this.activePage = this.status;
            return this.fetchPopularArticles();
          }
        }
      );
    }

    this.seo.generateTags({
      title: this.translate.instant('meta.articlesTitle'),
      description: this.translate.instant('meta.articlesDescription'),
      author: 'Zerofiltre.tech',
      image: 'https://i.ibb.co/p3wfyWR/landing-illustration-1.png'
    });
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.tags$.unsubscribe()
      this.articles$.unsubscribe()
    }
  }
}
