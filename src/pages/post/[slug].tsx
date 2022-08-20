import { GetStaticPaths, GetStaticProps } from 'next';
import { FiUser, FiCalendar, FiClock } from 'react-icons/fi';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { useMemo } from 'react';
import { useRouter } from 'next/router';
import { getPrismicClient } from '../../services/prismic';
import Header from '../../components/Header';
import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const { isFallback } = useRouter();

  const estimatedReadingTime = useMemo(() => {
    if (!post) {
      return '0 min';
    }

    const averageReadingTime = 200; // palavras/minuto

    const totalWords = post.data.content.reduce((contentAcc, contentCur) => {
      const amountWordsHeader = contentCur.heading
        ? contentCur.heading.split(' ').length
        : 0;

      const amountWordsBody = contentCur.body.reduce(
        (acc, cur) => acc + cur.text.split(' ').length,
        0
      );

      return contentAcc + amountWordsHeader + amountWordsBody;
    }, 0);

    return `${Math.ceil(totalWords / averageReadingTime)} min`;
  }, [post]);

  function formatedDate(date: string): string {
    return format(new Date(date), 'd MMM yyyy', {
      locale: ptBR,
    });
  }

  if (isFallback) {
    return <p>Carregando...</p>;
  }

  return (
    <div className={styles.postContainer}>
      <Header />
      <img className={styles.banner} src={post.data.banner.url} alt="" />
      <div className={commonStyles.container}>
        <h1>{post.data.title}</h1>

        <div className={commonStyles.chipContainer}>
          <span className={commonStyles.chip}>
            <FiCalendar size={20} />
            {formatedDate(post.first_publication_date)}
          </span>

          <span className={commonStyles.chip}>
            <FiUser size={20} />
            {post.data.author}
          </span>

          <span className={`${commonStyles.chip} ${styles.clockChip}`}>
            <FiClock size={20} />
            {estimatedReadingTime}
          </span>
        </div>

        <div className={styles.contentContainer}>
          {post.data.content.map(contentBlock => (
            <div key={contentBlock.body[0].text}>
              {contentBlock.heading && <h2>{contentBlock.heading}</h2>}

              <div className={styles.paragraphContainer}>
                {contentBlock.body.map(bodyElement => (
                  <p key={bodyElement.text}>{bodyElement.text}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient({});
  const posts = await prismic.getByType('posts');

  return {
    paths: posts.results.map(post => {
      return {
        params: {
          slug: post.uid,
        },
      };
    }),
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const prismic = getPrismicClient({});
  const { slug } = params;
  const response = await prismic.getByUID('posts', slug as string);

  return {
    props: {
      post: response,
    },
  };
};
