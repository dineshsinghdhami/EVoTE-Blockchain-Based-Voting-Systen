import { useAdmin } from "../../context/AdminContext";


/**
 * Context selector for institution / organization / post scoping.
 *
 * This component is rendered once inside AdminLayout.
 * Different admin pages decide which selectors are visible using "levels".
 *
 * Loading behavior:
 *
 * Institution loading
 * -> Institution select becomes skeleton
 *
 * Institution selected
 * -> Organizations load
 * -> Organization select becomes skeleton
 *
 * Organization selected
 * -> Posts load
 * -> Post select becomes skeleton
 */
function ContextSelector({
  levels = [],
}) {
  const {
    institutions,
    institutionsLoading,

    selectedInstitutionId,
    setSelectedInstitutionId,

    organizations,
    organizationsLoading,
    setOrganizations,

    selectedOrganizationId,
    setSelectedOrganizationId,

    posts,
    postsLoading,
    setPosts,

    selectedPostId,
    setSelectedPostId,

    loadOrganizations,
    loadPosts,
  } = useAdmin();


  // ==========================================================
  // NOTHING REQUIRED FOR THIS PAGE
  // ==========================================================

  if (levels.length === 0) {
    return null;
  }


  // ==========================================================
  // CURRENT SELECTIONS
  // ==========================================================

  const selectedInstitution =
    institutions.find(
      (institution) =>
        String(
          institution.id
        ) ===
        String(
          selectedInstitutionId
        )
    );


  const selectedOrganization =
    organizations.find(
      (organization) =>
        String(
          organization.id
        ) ===
        String(
          selectedOrganizationId
        )
    );


  const selectedPost =
    posts.find(
      (post) =>
        String(
          post.id
        ) ===
        String(
          selectedPostId
        )
    );


  // ==========================================================
  // WHICH SELECTORS SHOULD APPEAR
  // ==========================================================

  const showOrg =
    levels.includes(
      "organization"
    );


  const showPost =
    levels.includes(
      "post"
    );


  // ==========================================================
  // SELECT INSTITUTION
  // ==========================================================

  const handleInstitutionChange =
    async (event) => {
      const value =
        event.target.value;


      setSelectedInstitutionId(
        value
      );


      // Reset dependent context
      setSelectedOrganizationId(
        ""
      );

      setSelectedPostId(
        ""
      );

      setOrganizations(
        []
      );

      setPosts(
        []
      );


      if (value) {
        await loadOrganizations(
          value
        );
      }
    };


  // ==========================================================
  // SELECT ORGANIZATION
  // ==========================================================

  const handleOrganizationChange =
    async (event) => {
      const value =
        event.target.value;


      setSelectedOrganizationId(
        value
      );


      // Reset dependent post
      setSelectedPostId(
        ""
      );

      setPosts(
        []
      );


      if (value) {
        await loadPosts(
          selectedInstitutionId,
          value
        );
      }
    };


  // ==========================================================
  // SELECT POST
  // ==========================================================

  const handlePostChange =
    (event) => {
      setSelectedPostId(
        event.target.value
      );
    };


  // ==========================================================
  // UI
  // ==========================================================

  return (
    <>

      {/* =====================================================
          SKELETON CSS
      ===================================================== */}

      <style>
        {`

          /* =================================================
             SELECT SKELETON
          ================================================= */

          .context-select-skeleton {
            position: relative;

            width: 100%;
            height: 48px;

            box-sizing: border-box;

            overflow: hidden;

            border-radius: 9px;

            border:
              1px solid #3b3b3b;

            background:
              #292929;
          }


          .context-select-skeleton::after {
            content: "";

            position: absolute;

            inset: 0;

            transform:
              translateX(-100%);

            background:
              linear-gradient(
                90deg,
                transparent,
                rgba(255,255,255,0.04),
                rgba(255,255,255,0.11),
                rgba(255,255,255,0.04),
                transparent
              );

            animation:
              contextSelectorShimmer
              1.2s
              infinite;
          }


          @keyframes contextSelectorShimmer {
            100% {
              transform:
                translateX(100%);
            }
          }


          /* =================================================
             SKELETON TEXT
          ================================================= */

          .context-select-skeleton-line {
            position: absolute;

            top: 50%;
            left: 16px;

            width: 145px;
            height: 11px;

            transform:
              translateY(-50%);

            background:
              #373737;

            border-radius:
              5px;
          }


          /* =================================================
             FAKE ARROW
          ================================================= */

          .context-select-skeleton-arrow {
            position: absolute;

            top: 50%;
            right: 16px;

            width: 8px;
            height: 8px;

            border-right:
              2px solid #525252;

            border-bottom:
              2px solid #525252;

            transform:
              translateY(-65%)
              rotate(45deg);
          }


          /* =================================================
             DISABLED PLACEHOLDER
          ================================================= */

          .context-select-waiting {
            width: 100%;
            height: 48px;

            box-sizing:
              border-box;

            padding:
              0 14px;

            display:
              flex;

            align-items:
              center;

            border:
              1px solid #343434;

            border-radius:
              9px;

            background:
              #242424;

            color:
              #737373;

            font-size:
              14px;

            cursor:
              not-allowed;

            user-select:
              none;
          }

        `}
      </style>


      <div className="admin-context-bar">

        <div className="admin-context-fields">


          {/* =====================================================
              INSTITUTION
          ===================================================== */}

          <div className="admin-context-item">

            <label>
              Institution
            </label>


            {institutionsLoading ? (

              <div
                className="context-select-skeleton"
                aria-label="Loading institutions"
              >
                <div className="context-select-skeleton-line" />

                <div className="context-select-skeleton-arrow" />
              </div>

            ) : (

              <select
                value={
                  selectedInstitutionId
                }

                onChange={
                  handleInstitutionChange
                }
              >

                <option value="">
                  Select Institution
                </option>


                {institutions.map(
                  (institution) => (

                    <option
                      key={
                        institution.id
                      }

                      value={
                        institution.id
                      }
                    >
                      {institution.id}.{" "}
                      {institution.name}
                    </option>

                  )
                )}

              </select>

            )}

          </div>


          {/* =====================================================
              ORGANIZATION
          ===================================================== */}

          {showOrg && (

            <div className="admin-context-item">

              <label>
                Organization
              </label>


              {/* No institution selected */}

              {!selectedInstitutionId ? (

                <div className="context-select-waiting">
                  Select institution first
                </div>


              ) : organizationsLoading ? (

                /* ORGANIZATION BLOCKCHAIN LOADING */

                <div
                  className="context-select-skeleton"
                  aria-label="Loading organizations"
                >
                  <div className="context-select-skeleton-line" />

                  <div className="context-select-skeleton-arrow" />
                </div>


              ) : (

                <select
                  value={
                    selectedOrganizationId
                  }

                  onChange={
                    handleOrganizationChange
                  }
                >

                  <option value="">
                    Select Organization
                  </option>


                  {organizations.map(
                    (organization) => (

                      <option
                        key={
                          organization.id
                        }

                        value={
                          organization.id
                        }
                      >
                        {organization.id}.{" "}
                        {organization.name}
                      </option>

                    )
                  )}

                </select>

              )}

            </div>

          )}


          {/* =====================================================
              POST
          ===================================================== */}

          {showPost && (

            <div className="admin-context-item">

              <label>
                Post
              </label>


              {/* No organization selected */}

              {!selectedOrganizationId ? (

                <div className="context-select-waiting">
                  Select organization first
                </div>


              ) : postsLoading ? (

                /* POST BLOCKCHAIN LOADING */

                <div
                  className="context-select-skeleton"
                  aria-label="Loading posts"
                >
                  <div className="context-select-skeleton-line" />

                  <div className="context-select-skeleton-arrow" />
                </div>


              ) : (

                <select
                  value={
                    selectedPostId
                  }

                  onChange={
                    handlePostChange
                  }
                >

                  <option value="">
                    Select Post
                  </option>


                  {posts.map(
                    (post) => (

                      <option
                        key={
                          post.id
                        }

                        value={
                          post.id
                        }
                      >
                        {post.id}.{" "}
                        {post.title}
                      </option>

                    )
                  )}

                </select>

              )}

            </div>

          )}

        </div>


        {/* =====================================================
            BREADCRUMB / CURRENT SELECTION
        ===================================================== */}

        {!institutionsLoading &&
          !organizationsLoading &&
          !postsLoading &&
          (
            selectedInstitution ||
            selectedOrganization ||
            selectedPost
          ) && (

          <div className="admin-context-trail">

            {selectedInstitution && (

              <span>
                {
                  selectedInstitution.name
                }
              </span>

            )}


            {showOrg &&
            selectedOrganization && (

              <>

                <span className="admin-context-sep">
                  ›
                </span>

                <span>
                  {
                    selectedOrganization.name
                  }
                </span>

              </>

            )}


            {showPost &&
            selectedPost && (

              <>

                <span className="admin-context-sep">
                  ›
                </span>

                <span>
                  {
                    selectedPost.title
                  }
                </span>

              </>

            )}

          </div>

        )}

      </div>

    </>
  );
}


export default ContextSelector;