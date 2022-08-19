import { GetStaticProps } from 'next';
import Link from 'next/link';
import { useState } from 'react';
import { FiUser, FiCalendar } from 'react-icons/fi';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const [results, setResults] = useState(postsPagination.results);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);

  async function handleLoadMorePosts(): Promise<void> {
    fetch(nextPage)
      .then(response => response.json())
      .then(data => {
        setResults([...results, ...data.results]);
        setNextPage(data.next_page);
      });
  }

  return (
    <div className={commonStyles.container}>
      <img className={styles.topImage} src="/Logo.svg" alt="logo" />
      <div className={styles.resultContainer}>
        {results.map(result => (
          <Link href={`/post/${result.uid}`} key={result.uid}>
            <a className={styles.result}>
              <strong>{result.data.title}</strong>
              <p>{result.data.subtitle}</p>
              <div className={commonStyles.chipContainer}>
                <span className={commonStyles.chip}>
                  <FiCalendar size={20} />
                  {result.first_publication_date}
                </span>

                <span className={commonStyles.chip}>
                  <FiUser size={20} />
                  {result.data.author}
                </span>
              </div>
            </a>
          </Link>
        ))}
      </div>

      {nextPage && (
        <button
          className={styles.loadMoreButton}
          type="button"
          onClick={handleLoadMorePosts}
        >
          Carregar mais posts
        </button>
      )}
    </div>
  );
}

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  const prismic = getPrismicClient({});

  const postsResponse = await prismic.getByType('posts', {
    pageSize: 1,
  });

  const results = postsResponse.results.map(result => {
    return {
      uid: result.uid,
      first_publication_date: result.first_publication_date,
      data: {
        title: result.data.title as string,
        subtitle: result.data.subtitle as string,
        author: result.data.author as string,
      },
    };
  });

  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results,
      },
    },
  };
};
