import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { SeoService } from 'src/app/services/seo.service';
import { Article, Tag } from '../article.model';
import { ArticleService } from '../article.service';
import { MatDialog } from '@angular/material/dialog'
import { ArticleEntryPopupComponent } from '../article-entry-popup/article-entry-popup.component';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { calcReadingTime, formatDate } from 'src/app/services/utilities.service';
import { MessageService } from 'src/app/services/message.service';
import { map, Observable, Subscription } from 'rxjs';
import { AuthService } from 'src/app/user/auth.service';
import { User } from 'src/app/user/user.model';

@Component({
  selector: 'app-articles-list',
  templateUrl: './articles-list.component.html',
  styleUrls: ['./articles-list.component.css'],
})
export class ArticlesListComponent implements OnInit, OnDestroy {
  public articles!: Article[];
  public tagList!: Tag[];
  public pageNumber: number = 0;
  public pageItemsLimit: number = 5;
  public activePage: string = 'recent';
  public loading: boolean = false;
  public errorMessage: string = '';
  public mainPage = true;

  public articlesSub!: Subscription;

  constructor(
    private seo: SeoService,
    private articleService: ArticleService,
    private dialogRef: MatDialog,
    private router: Router,
    private location: Location,
    public authService: AuthService
  ) { }

  openArticleEntryDialog(): void {
    this.dialogRef.open(ArticleEntryPopupComponent, {
      width: '850px',
      height: '350px',
      panelClass: 'article-popup-panel',
      // backdropClass: 'article-popup-backdrop',
      data: {
        router: this.router
      }
    });
  }

  public fetchListOfTags(): void {
    this.loading = true;
    this.articleService.getListOfTags().subscribe({
      next: (response: Tag[]) => {
        this.tagList = response
      },
      error: (_error: HttpErrorResponse) => {
        this.loading = false;
      }
    })
  }

  public fetchArticles(): void {
    this.loading = true;
    this.articleService.getArticles(this.pageNumber, this.pageItemsLimit, 'published').subscribe({
      next: (response: Article[]) => {
        this.articles = this.sortByDate(response).filter((item: Article) => item.status === 'PUBLISHED')
        this.setArticlesReadingTime(response);
        this.loading = false;
      },
      error: (_error: HttpErrorResponse) => {
        this.loading = false;
        this.errorMessage = 'Oops...!'
      }
    })
  }

  public getSavedArticles(): void {
    this.loading = true;
    this.mainPage = false;

    this.articlesSub = this.articleService.getArticles(this.pageNumber, this.pageItemsLimit, 'draft').subscribe({
      next: (response: Article[]) => {
        this.articles = response
          .filter((item: Article) => item.status === 'DRAFT')
          .sort((a: any, b: any) => new Date(b.lastSavedAt).valueOf() - new Date(a.lastSavedAt).valueOf())
        this.setArticlesReadingTime(response);
        this.loading = false;
      },
      error: (_error: HttpErrorResponse) => {
        this.loading = false;
      }
    });
  }


  public setArticlesReadingTime(articles: Article[]): void {
    for (const article of articles) {
      calcReadingTime(article);
    }
  }

  public sortBy(trendName: string): void {
    let results: Article[] = [];

    if (trendName === 'recent') {
      this.activePage = 'recent';
      results = this.sortByDate(this.articles);
      this.articles = results;
      this.location.go(this.router.url)
    }

    if (trendName === 'popular') {
      this.activePage = 'popular'
      results = this.sortByPopularity(this.articles);
      this.articles = results;
      this.location.go(`${this.router.url}?sortBy=${trendName}`)
    }

    if (trendName === 'trending') {
      this.activePage = 'trending'
      results = this.sortByTrend(this.articles);
      this.articles = results;
      this.location.go(`${this.router.url}?sortBy=${trendName}`)
    }
  }

  private sortByDate(list: Article[]): Article[] {
    return list
      ?.sort((a: any, b: any) => new Date(b.publishedAt).valueOf() - new Date(a.publishedAt).valueOf())
  }

  private sortByPopularity(list: Article[]): Article[] {
    return list
  }

  private sortByTrend(list: Article[]): Article[] {
    return list
  }

  public sortByTag(tagName: any): void {
    const results: Article[] = []

    for (const article of this.articles) {
      if (article.tags?.some(tag => tag.name?.toLowerCase().indexOf(tagName.toLowerCase()) !== -1)) {
        results.push(article)
      }

      this.articles = results

      if (results.length === 0) {
        this.fetchArticles()
      }
    }

    this.location.go(`${this.router.url}?tag=${tagName}`)
  }

  public searchArticles(key: string): void {
    const results: Article[] = []

    for (const article of this.articles) {
      if (
        article.title?.toLowerCase().indexOf(key.toLowerCase()) !== -1 ||
        article.tags?.some(tag => tag.name?.toLowerCase().indexOf(key.toLowerCase()) !== -1) ||
        article.author?.fullName?.toLowerCase().indexOf(key.toLowerCase()) !== -1
      ) {
        results.push(article)
      }

      this.articles = results

      if (results.length === 0 || !key) {
        this.fetchArticles()
      }
    }
  }

  public setDateFormat(date: any) {
    return formatDate(date)
  }


  ngOnInit(): void {
    this.seo.generateTags({
      title: 'Tous les articles | Zerofiltre.tech',
      description: "Développez des Apps à valeur ajoutée pour votre business et pas que pour l'IT. Avec Zerofiltre, profitez d'offres taillées pour chaque entreprise. Industrialisez vos Apps. Maintenance, extension, supervision.",
      author: 'Zerofiltre.tech',
      type: 'website',
      image: 'https://i.ibb.co/p3wfyWR/landing-illustration-1.png'
    });

    this.location.go('/articles');
    this.fetchArticles();
    this.fetchListOfTags();
  }

  ngOnDestroy(): void {
    if (this.articlesSub) {
      this.articlesSub.unsubscribe();
    }
  }
}
