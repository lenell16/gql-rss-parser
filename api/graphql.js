require("regenerator-runtime/runtime");
const { get } = require("httpie");
const { parse } = require("unread");
const { ApolloServer, gql } = require("apollo-server-micro");

const typeDefs = gql`
	type Feed {
		id: String
		title: String
		description: String
		feedURL: String
		updated: String
		published: String
		language: String
		image: String
		generator: String
		links: [String]
		items: [Item]
	}

	type Link {
		href: String
	}

	type Item {
		id: String
		title: String
		description: String
		content: String
		updated: String
		published: String
		image: String
		links: [String]
	}

	type Query {
		feed(url: String!): Feed
	}
`;

const resolvers = {
	Query: {
		feed: async (_, args) => {
			const { data } = await get(args.url);
			const output = await parse(data);
			return output;
		},
	},
	Feed: {
		title: ({ feed }) => feed.title(),
		links: ({ feed }) => feed.links() && feed.links().map(({ href }) => href),
		description: ({ feed }) => feed.description(),
		feedURL: ({ feed }) => feed.feedURL(),
		updated: ({ feed }) => feed.updated(),
		published: ({ feed }) => feed.published(),
		language: ({ feed }) => feed.language(),
		image: ({ feed }) => feed.image(),
		id: ({ feed }) => feed.id(),
		generator: ({ feed }) => feed.generator(),
		items: ({ items }) => items,
	},
	Item: {
		id: (item) => item.id(),
		title: (item) => item.title(),
		description: (item) => item.description(),
		content: (item) => item.content(),
		links: (item) => item.links() && item.links().map(({ href }) => href),
		updated: (item) => item.updated(),
		published: (item) => item.published(),
		image: (item) => item.image(),
	},
};

const server = new ApolloServer({
	typeDefs,
	resolvers,
	playground: true,
	introspection: true,
});

module.exports = server.createHandler({
	path: "/api/graphql",
});
