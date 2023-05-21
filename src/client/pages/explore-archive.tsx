import { PostSearch } from "@/components/PostSearch";
import { PageWrapper } from "@/components/PageWrapper";

export default function ExplorePlayedArchive(): JSX.Element{
  return (
    <PageWrapper>
      <PostSearch
        fullArchive={false}
      />
    </PageWrapper>
  );
};
